import { useCallback, useEffect, useRef, useState } from 'react';
import type { PerfSnapshot, BaselineSummary } from '../components/settings/perf/perf-types';
import { fetchPerfMetrics, fetchBaselines } from '../services/perf-api';

const POLL_INTERVAL_MS = 5_000;

export function usePerfMetrics() {
  const [snapshot, setSnapshot] = useState<PerfSnapshot | null>(null);
  const [baselines, setBaselines] = useState<BaselineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const refresh = useCallback(async () => {
    try {
      const [snap, bl] = await Promise.all([fetchPerfMetrics(), fetchBaselines()]);
      setSnapshot(snap);
      setBaselines(bl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [refresh]);

  return { snapshot, baselines, loading, error, refresh };
}
