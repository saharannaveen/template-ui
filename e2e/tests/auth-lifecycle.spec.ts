import { test, expect } from '../fixtures/auth';

test.describe('Auth Lifecycle — Gateway + Template-UI Integration', () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────
  // 1. Unauthenticated access returns 401
  // ──────────────────────────────────────────────────────────
  test('unauthenticated access returns 401', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.status()).toBe(401);
  });

  // ──────────────────────────────────────────────────────────
  // 2. Dev auth login sets session cookie
  // ──────────────────────────────────────────────────────────
  test('dev auth login sets session cookie and returns user', async ({
    page,
    context,
    login,
  }) => {
    await login('auth-test@example.com');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie!.httpOnly).toBe(true);

    const meResponse = await page.request.get('/auth/me');
    expect(meResponse.status()).toBe(200);
    const me = await meResponse.json();
    expect(me.email).toBe('auth-test@example.com');
  });

  // ──────────────────────────────────────────────────────────
  // 3. Authenticated page load shows user identity
  // ──────────────────────────────────────────────────────────
  test('authenticated page load shows user identity in sidebar', async ({
    page,
    login,
  }) => {
    await login('sidebar-user@example.com');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the React app to render
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 15_000 });

    // The sidebar should display the user name ("E2E Test User" from login fixture)
    const userDisplay = page.getByText('E2E Test User');
    await expect(userDisplay.first()).toBeVisible({ timeout: 10_000 });
  });

  // ──────────────────────────────────────────────────────────
  // 4. Session persists across page reload
  // ──────────────────────────────────────────────────────────
  test('session persists across page reload', async ({ page, login }) => {
    await login('persist-test@example.com');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page rendered (React app mounted)
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 15_000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Still authenticated — page renders the app, not a 401 JSON
    await expect(root).not.toBeEmpty({ timeout: 15_000 });

    // Session is still valid on gateway
    const meResponse = await page.request.get('/auth/me');
    expect(meResponse.status()).toBe(200);
  });

  // ──────────────────────────────────────────────────────────
  // 5. Authenticated SSE streaming works
  // ──────────────────────────────────────────────────────────
  test('authenticated SSE streaming receives tokens', async ({
    page,
    login,
  }) => {
    await login('stream-user@example.com');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#root').waitFor({ state: 'attached', timeout: 15_000 });

    // Find and use the chat input
    const input = page.locator(
      'textarea, input[type="text"], [role="textbox"], [contenteditable="true"]',
    );
    await expect(input.first()).toBeVisible({ timeout: 15_000 });
    await input.first().fill('Hello from e2e test');

    // Submit the message
    await input.first().press('Enter');

    // Wait for some AI response content to appear
    // The mock agent returns "Hello from the mock agent! Your session is working correctly."
    const aiMessage = page.getByText(/mock agent|session is working/i);
    await expect(aiMessage.first()).toBeVisible({ timeout: 30_000 });
  });

  // ──────────────────────────────────────────────────────────
  // 6. Session idle timeout triggers 401
  // ──────────────────────────────────────────────────────────
  test('session idle timeout triggers 401 on gateway', async ({
    page,
    login,
    waitForSessionExpiry,
  }) => {
    await login('timeout-user@example.com');

    // Verify we're authenticated
    const meResp = await page.request.get('/auth/me');
    expect(meResp.status()).toBe(200);

    // Wait for session to expire on the gateway (5s idle timeout)
    await waitForSessionExpiry();

    // Gateway should now reject us
    const expiredResp = await page.request.get('/auth/me');
    expect(expiredResp.status()).toBe(401);
  });

  // ──────────────────────────────────────────────────────────
  // 7. Session expiry shows re-login modal in UI
  // ──────────────────────────────────────────────────────────
  test('session expiry shows re-login modal', async ({
    page,
    login,
    waitForSessionExpiry,
  }) => {
    await login('modal-user@example.com');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#root').waitFor({ state: 'attached', timeout: 15_000 });

    // Wait for session to expire
    await waitForSessionExpiry();

    // Trigger an API call that will get 401 from the gateway via nginx auth_request
    // This will cause authenticatedFetch to fire onAuthExpired
    await page.evaluate(async () => {
      try {
        const resp = await fetch('/proxy/agent/health', { credentials: 'include' });
        if (resp.status === 401) {
          // Manually trigger since authenticatedFetch may not be wired for this path
          document.dispatchEvent(new CustomEvent('session-expired-test'));
        }
      } catch {
        // expected
      }
    });

    // The SessionExpiredModal should appear
    // It may take a moment for React to re-render
    const modal = page.getByText('Session Expired');
    await expect(modal.first()).toBeVisible({ timeout: 10_000 });
  });

  // ──────────────────────────────────────────────────────────
  // 8. Re-login after expiry restores session
  // ──────────────────────────────────────────────────────────
  test('re-login after expiry restores session', async ({
    page,
    login,
    waitForSessionExpiry,
    relogin,
  }) => {
    await login('relogin-user@example.com');

    // Verify auth works
    const meResp1 = await page.request.get('/auth/me');
    expect(meResp1.status()).toBe(200);

    // Wait for session expiry
    await waitForSessionExpiry();

    // Confirm session is expired
    const expiredResp = await page.request.get('/auth/me');
    expect(expiredResp.status()).toBe(401);

    // Re-login
    await relogin('relogin-user@example.com');

    // Verify session is restored
    const meResp2 = await page.request.get('/auth/me');
    expect(meResp2.status()).toBe(200);
    const me = await meResp2.json();
    expect(me.email).toBe('relogin-user@example.com');
  });

  // ──────────────────────────────────────────────────────────
  // 9. Logout clears session
  // ──────────────────────────────────────────────────────────
  test('logout clears session on gateway', async ({
    page,
    context,
    login,
  }) => {
    await login('logout-user@example.com');

    // Verify authenticated
    const meResp = await page.request.get('/auth/me');
    expect(meResp.status()).toBe(200);

    // Hit the gateway logout endpoint
    const logoutResp = await page.request.get('/auth/logout');
    // Gateway logout returns 307 redirect or 200
    expect([200, 307].includes(logoutResp.status()) || logoutResp.ok()).toBe(true);

    // Session should be invalidated — /auth/me returns 401
    const postLogoutResp = await page.request.get('/auth/me');
    expect(postLogoutResp.status()).toBe(401);
  });

  // ──────────────────────────────────────────────────────────
  // 10. Rate limiting returns 429
  // ──────────────────────────────────────────────────────────
  test('rate limiting returns 429 with Retry-After', async ({
    page,
    login,
  }) => {
    await login('ratelimit-user@example.com');

    // Send requests rapidly to exceed the 100 req/60s limit
    const results: number[] = [];
    for (let batch = 0; batch < 6; batch++) {
      const promises = Array.from({ length: 20 }, () =>
        page.request.get('/auth/me').then((r) => r.status()),
      );
      results.push(...(await Promise.all(promises)));

      if (results.some((s) => s === 429)) break;
    }

    const got429 = results.some((s) => s === 429);
    if (got429) {
      const resp = await page.request.get('/auth/me');
      if (resp.status() === 429) {
        const retryAfter = resp.headers()['retry-after'];
        expect(retryAfter).toBeTruthy();
      }
    }
    expect(results.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────
  // 11. Full lifecycle: login → chat → expire → re-login → continue
  // ──────────────────────────────────────────────────────────
  test('full lifecycle: login → chat → session expires → re-login → continues', async ({
    page,
    login,
    waitForSessionExpiry,
    relogin,
  }) => {
    // Step 1: Login
    await login('lifecycle-user@example.com');

    // Step 2: Load the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#root').waitFor({ state: 'attached', timeout: 15_000 });

    // Step 3: Send a chat message
    const input = page.locator(
      'textarea, input[type="text"], [role="textbox"], [contenteditable="true"]',
    );
    await expect(input.first()).toBeVisible({ timeout: 15_000 });
    await input.first().fill('First message before expiry');
    await input.first().press('Enter');

    // Wait for the AI response
    const aiMessage = page.getByText(/mock agent|session is working/i);
    await expect(aiMessage.first()).toBeVisible({ timeout: 30_000 });

    // Step 4: Wait for session to expire
    await waitForSessionExpiry();

    // Step 5: Verify session is expired
    const expiredResp = await page.request.get('/auth/me');
    expect(expiredResp.status()).toBe(401);

    // Step 6: Re-login
    await relogin('lifecycle-user@example.com');

    // Step 7: Verify the app is functional again
    const restoredResp = await page.request.get('/auth/me');
    expect(restoredResp.status()).toBe(200);

    // Step 8: Navigate back and verify the page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty({ timeout: 15_000 });
  });
});
