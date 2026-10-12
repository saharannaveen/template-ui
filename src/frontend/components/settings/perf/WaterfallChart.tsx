import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SpanMetric } from './perf-types';

const SPAN_COLORS: Record<string, string> = {
  'startup.cold': '#6366f1',
  'auth.token_refresh': '#f59e0b',
  'graph.build': '#3b82f6',
  'graph.personalization': '#8b5cf6',
  'graph.mcp_tools': '#10b981',
  'mcp.server_connect': '#14b8a6',
  'mcp.tool_discovery': '#06b6d4',
  'model.create': '#ef4444',
  'pii.scrub': '#f97316',
  'personalization.load': '#a855f7',
  'graph.streaming': '#22c55e',
};

const FRIENDLY_NAMES: Record<string, string> = {
  'startup.cold': 'Cold Start',
  'auth.token_refresh': 'Auth Token',
  'graph.build': 'Graph Build',
  'graph.personalization': 'Personalization',
  'graph.mcp_tools': 'MCP Tools',
  'mcp.server_connect': 'MCP Connect',
  'mcp.tool_discovery': 'Tool Discovery',
  'model.create': 'Model Init',
  'pii.scrub': 'PII Scrub',
  'personalization.load': 'Load Prefs',
  'graph.streaming': 'Streaming',
};

function friendlySpanName(name: string): string {
  return FRIENDLY_NAMES[name] ?? name.replace(/[._]/g, ' ');
}

interface WaterfallChartProps {
  spans: SpanMetric[];
}

export function WaterfallChart({ spans }: WaterfallChartProps) {
  if (spans.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">No span data yet. Send a request to populate the waterfall.</p>
      </div>
    );
  }

  const sorted = [...spans].sort((a, b) => b.avg_ms - a.avg_ms);
  const data = sorted.map((s) => ({
    name: friendlySpanName(s.name),
    avg: Math.round(s.avg_ms * 10) / 10,
    p95: Math.round(s.p95_ms * 10) / 10,
    pct: s.pct_of_total,
    rawName: s.name,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Waterfall (avg ms)</h4>
        <span className="text-[10px] text-muted-foreground">
          {spans.reduce((sum, s) => sum + s.avg_ms, 0).toFixed(0)} ms total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(spans.length * 32 + 20, 120)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 90 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--foreground)' }}
            tickLine={false}
            axisLine={false}
            width={85}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${value} ms (${props.payload.pct}% of total)`,
              'avg',
            ]}
          />
          <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((d) => (
              <Cell key={d.rawName} fill={SPAN_COLORS[d.rawName] ?? '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
