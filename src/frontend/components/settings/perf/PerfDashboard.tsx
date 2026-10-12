import { useState } from 'react';
import { ExternalLink, RefreshCw, Activity, BarChart3, GitCompare, Zap, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerfMetrics } from '../../../hooks/usePerfMetrics';
import { StatTile } from './StatTile';
import { WaterfallChart } from './WaterfallChart';
import { BaselineManager } from './BaselineManager';
import type { Insight } from './perf-types';

type PerfTab = 'overview' | 'waterfall' | 'baselines';

const TABS: { id: PerfTab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'waterfall', label: 'Waterfall', icon: BarChart3 },
  { id: 'baselines', label: 'Baselines', icon: GitCompare },
];

function errorRateColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct < 1) return 'green';
  if (pct < 5) return 'amber';
  return 'red';
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function insightIcon(level: string) {
  if (level === 'warning') return <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />;
  if (level === 'error') return <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />;
  return <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />;
}

function insightStyle(level: string): string {
  if (level === 'warning') return 'border-amber-500/20 bg-amber-500/5';
  if (level === 'error') return 'border-red-500/20 bg-red-500/5';
  return 'border-emerald-500/20 bg-emerald-500/5';
}

function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Insights</h4>
      {insights.map((insight, i) => (
        <div key={i} className={cn('rounded-md border px-3 py-2 flex items-start gap-2', insightStyle(insight.level))}>
          {insightIcon(insight.level)}
          <p className="text-xs text-foreground leading-relaxed">{insight.message}</p>
        </div>
      ))}
    </div>
  );
}

export function PerfDashboard() {
  const [activeTab, setActiveTab] = useState<PerfTab>('overview');
  const { snapshot, baselines, loading, error, refresh } = usePerfMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground ml-2">Loading metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-6 text-center space-y-1.5">
        <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-xs text-muted-foreground">Check that the agent backend has performance endpoints enabled.</p>
      </div>
    );
  }

  if (!snapshot) return null;

  const { ttft, throughput, error_budget, resources, spans, insights, jaeger_url, uptime_seconds } = snapshot;
  const hasData = throughput.conversations_started > 0 || error_budget.total_requests > 0;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">{formatUptime(uptime_seconds)}</span>
          <button
            onClick={refresh}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {jaeger_url && (
            <a
              href={jaeger_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-primary hover:bg-primary/10 transition-colors"
              title="Open Jaeger UI"
            >
              <ExternalLink className="w-3 h-3" /> Jaeger
            </a>
          )}
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {!hasData && (
            <div className="flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Waiting for requests. Send a chat message to populate metrics.</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatTile label="TTFT e2e p50" value={ttft.e2e.p50_ms.toFixed(0)} unit="ms" sublabel={`p95: ${ttft.e2e.p95_ms.toFixed(0)} ms`} />
            <StatTile label="TTFT LLM p50" value={ttft.llm_only.p50_ms.toFixed(0)} unit="ms" sublabel={`p95: ${ttft.llm_only.p95_ms.toFixed(0)} ms`} />
            <StatTile label="Requests/sec" value={throughput.requests_per_second} sublabel={`${error_budget.total_requests} total`} />
            <StatTile label="Error Rate" value={error_budget.error_rate_pct.toFixed(2)} unit="%" color={errorRateColor(error_budget.error_rate_pct)} sublabel={`${throughput.stream_errors} errors`} />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatTile size="sm" label="Streams" value={throughput.streams_active} />
            <StatTile size="sm" label="Active" value={throughput.conversations_active} />
            <StatTile size="sm" label="Tok/s" value={throughput.tokens_per_second} />
            <StatTile size="sm" label="Errors" value={throughput.stream_errors} color={throughput.stream_errors > 0 ? 'red' : 'default'} />
            <StatTile size="sm" label="CPU" value={resources.cpu_percent != null ? resources.cpu_percent.toFixed(1) : '--'} unit="%" />
            <StatTile size="sm" label="Memory" value={resources.memory_rss_mb.toFixed(0)} unit="MB" color={resources.memory_rss_mb > 512 ? 'amber' : 'default'} />
          </div>

          <InsightsPanel insights={insights} />
        </div>
      )}

      {/* Waterfall */}
      {activeTab === 'waterfall' && (
        <div className="space-y-4">
          <WaterfallChart spans={spans} />
          {Object.keys(ttft.by_prompt_length).length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">TTFT by Prompt Length</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ttft.by_prompt_length).map(([bucket, metrics]) => (
                  <StatTile key={bucket} size="sm" label={`${bucket}`} value={metrics.p50_ms.toFixed(0)} unit="ms p50" sublabel={`${metrics.samples} samples`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Baselines */}
      {activeTab === 'baselines' && (
        <BaselineManager baselines={baselines} onRefresh={refresh} />
      )}
    </div>
  );
}
