import { buildAppPath } from '../lib/app-paths';
import type { PerfSnapshot, BaselineSummary, BaselineComparison } from '../components/settings/perf/perf-types';

async function perfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildAppPath(`/api/proxy/agent${path}`), {
    credentials: 'same-origin',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(window.USER_DATA?.accessToken ? { 'X-Token': window.USER_DATA.accessToken } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`perf API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchPerfMetrics(): Promise<PerfSnapshot> {
  return perfFetch<PerfSnapshot>('/perf/metrics');
}

export async function fetchBaselines(): Promise<BaselineSummary[]> {
  const data = await perfFetch<{ baselines: BaselineSummary[] }>('/perf/baselines');
  return data.baselines;
}

export async function saveBaseline(label: string): Promise<{ id: number; label: string }> {
  return perfFetch('/perf/baselines', {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export async function deleteBaseline(id: number): Promise<void> {
  await perfFetch(`/perf/baselines/${id}`, { method: 'DELETE' });
}

export async function compareBaseline(id: number): Promise<BaselineComparison> {
  return perfFetch<BaselineComparison>(`/perf/baselines/${id}/compare`);
}
