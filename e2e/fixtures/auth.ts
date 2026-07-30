import { test as base, expect } from '@playwright/test';

export interface AuthFixtures {
  login: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  waitForSessionExpiry: () => Promise<void>;
  relogin: (email?: string) => Promise<void>;
}

/**
 * Seed a dummy SSO token in Valkey for a dev auth user.
 *
 * The gateway's /auth/check endpoint looks up `sso:token:{sub}` in Valkey.
 * Dev auth doesn't store tokens there, so auth_request always fails unless
 * we seed a dummy token. Valkey is exposed on port 6399 from the compose stack.
 */
async function seedValkeyToken(sub: string): Promise<void> {
  const { execSync } = await import('child_process');
  const tokenData = JSON.stringify({
    access_token: `dev-access-token-${sub}`,
    refresh_token: `dev-refresh-token-${sub}`,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  });
  // Use redis-cli via podman exec to set the token
  try {
    execSync(
      `podman exec e2e_valkey_1 valkey-cli SET "sso:token:${sub}" '${tokenData}' EX 3600`,
      { stdio: 'pipe' },
    );
  } catch {
    // Fallback: try direct connection if podman exec fails
    try {
      execSync(
        `redis-cli -p 6399 SET "sso:token:${sub}" '${tokenData}' EX 3600`,
        { stdio: 'pipe' },
      );
    } catch {
      // If both fail, tests will catch the 401 from /auth/check
      console.warn('Could not seed Valkey token — /auth/check may fail');
    }
  }
}

/**
 * Flush rate limit keys from Valkey so retries don't get 429'd
 * by counters left over from the previous test run.
 */
async function flushRateLimitKeys(): Promise<void> {
  const { execSync } = await import('child_process');
  try {
    const keys = execSync(
      'podman exec e2e_valkey_1 valkey-cli KEYS "gw:ratelimit:*"',
      { stdio: 'pipe' },
    ).toString().trim();
    if (keys) {
      for (const key of keys.split('\n')) {
        execSync(
          `podman exec e2e_valkey_1 valkey-cli DEL "${key}"`,
          { stdio: 'pipe' },
        );
      }
    }
  } catch {
    // best-effort
  }
}

export const test = base.extend<AuthFixtures>({
  login: async ({ page, context, baseURL }, use) => {
    await flushRateLimitKeys();
    const loginFn = async (email = 'e2e-test@example.com') => {
      const origin = baseURL || 'http://localhost:3100';
      const response = await page.request.post('/auth/dev/login', {
        data: { email, name: 'E2E Test User' },
        headers: { Origin: origin },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('authenticated');
      expect(body.user.email).toBe(email);

      // Seed a dummy SSO token in Valkey so /auth/check passes
      const sub = body.user.sub || `dev-${email}`;
      await seedValkeyToken(sub);

      const cookies = await context.cookies();
      const sessionCookie = cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeTruthy();
    };
    await use(loginFn);
  },

  logout: async ({ page }, use) => {
    const logoutFn = async () => {
      await page.getByRole('button', { name: /log\s*out/i }).click();
    };
    await use(logoutFn);
  },

  waitForSessionExpiry: async ({ page }, use) => {
    const waitFn = async () => {
      // Gateway is configured with SESSION_IDLE_TIMEOUT=15s.
      // Wait 20s (not 16s) because prior SSE streaming refreshes the
      // Valkey TTL via auth_request — the actual idle period starts
      // after the last nginx-proxied request, not when JS calls this.
      await page.waitForTimeout(20_000);
    };
    await use(waitFn);
  },

  relogin: async ({ page, baseURL }, use) => {
    const reloginFn = async (email = 'e2e-test@example.com') => {
      const origin = baseURL || 'http://localhost:3100';
      const response = await page.request.post('/auth/dev/login', {
        data: { email, name: 'E2E Test User' },
        headers: { Origin: origin },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      const sub = body.user.sub || `dev-${email}`;
      await seedValkeyToken(sub);
    };
    await use(reloginFn);
  },
});

export { expect };
