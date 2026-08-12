import { authenticatedFetch } from './authenticated-fetch';
import type { Integration } from '../types/integration';

export async function getIntegrations(): Promise<Integration[]> {
  const response = await authenticatedFetch('/api/integrations', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch integrations: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.integrations ?? []) as Integration[];
}

export async function saveIntegration(
  provider: string,
  data: Record<string, string>,
): Promise<void> {
  const response = await authenticatedFetch(`/api/integrations/${encodeURIComponent(provider)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save integration: ${response.statusText}`);
  }
}

export async function revokeIntegration(provider: string): Promise<void> {
  const response = await authenticatedFetch(`/api/integrations/${encodeURIComponent(provider)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to revoke integration: ${response.statusText}`);
  }
}

export async function testIntegration(
  provider: string,
): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(
    `/api/integrations/${encodeURIComponent(provider)}/test`,
    { method: 'GET' },
  );

  if (!response.ok) {
    throw new Error(`Failed to test integration: ${response.statusText}`);
  }

  return (await response.json()) as { success: boolean; message: string };
}
