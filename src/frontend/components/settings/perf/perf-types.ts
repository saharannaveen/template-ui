export interface TtftMetrics {
  p50_ms: number;
  p75_ms: number;
  p95_ms: number;
  p99_ms: number;
  samples: number;
  avg_ms?: number;
}

export interface TtftSection {
  e2e: TtftMetrics;
  llm_only: TtftMetrics;
  by_prompt_length: Record<string, TtftMetrics>;
}

export interface ThroughputSection {
  conversations_started: number;
  conversations_completed: number;
  conversations_active: number;
  messages_sent: number;
  streams_active: number;
  stream_errors: number;
  avg_stream_duration_ms: number;
  requests_per_second: number;
  tokens_per_second: number;
}

export interface ErrorBudgetSection {
  total_requests: number;
  errors_by_type: Record<string, number>;
  error_rate_pct: number;
}

export interface ResourceSection {
  cpu_percent: number | null;
  memory_rss_mb: number;
  memory_heap_mb: number | null;
}

export interface SpanMetric {
  name: string;
  label: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  count: number;
  color: string;
  pct_of_total: number;
}

export interface Insight {
  level: string;
  message: string;
  metric: string;
  value: number;
}

export interface PerfSnapshot {
  ttft: TtftSection;
  throughput: ThroughputSection;
  error_budget: ErrorBudgetSection;
  resources: ResourceSection;
  spans: SpanMetric[];
  insights: Insight[];
  jaeger_url: string;
  service_name: string;
  uptime_seconds: number;
}

export interface BaselineSummary {
  id: number;
  label: string;
  created_at: string;
  branch: string;
  commit_hash: string;
  ttft_e2e_p50_ms: number;
  conversations: number;
}

export interface ComparisonMetric {
  name: string;
  current: number;
  baseline: number;
  delta: number;
  delta_pct: number;
  status: 'improved' | 'regressed' | 'unchanged';
  unit: string;
}

export interface BaselineComparison {
  metrics: ComparisonMetric[];
  baseline_label: string;
  baseline_date: string;
}
