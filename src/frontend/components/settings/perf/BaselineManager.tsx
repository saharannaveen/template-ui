import { useState } from 'react';
import { Trash2, GitCompare, Save, ArrowDown, ArrowUp, Minus, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaselineSummary, BaselineComparison, ComparisonMetric } from './perf-types';
import { saveBaseline, deleteBaseline, compareBaseline } from '../../../services/perf-api';

function StatusIcon({ status }: { status: ComparisonMetric['status'] }) {
  if (status === 'improved') return <ArrowDown className="w-3 h-3 text-emerald-500" />;
  if (status === 'regressed') return <ArrowUp className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function DeltaText({ metric }: { metric: ComparisonMetric }) {
  const isGood = metric.status === 'improved';
  const isBad = metric.status === 'regressed';
  if (metric.status === 'unchanged') {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  return (
    <span className={cn('text-xs font-medium', isGood ? 'text-emerald-500' : isBad ? 'text-red-500' : '')}>
      {metric.delta > 0 ? '+' : ''}{metric.delta.toFixed(1)}{metric.unit} ({metric.delta_pct > 0 ? '+' : ''}{metric.delta_pct.toFixed(1)}%)
    </span>
  );
}

export function BaselineManager({ baselines, onRefresh }: { baselines: BaselineSummary[]; onRefresh: () => void }) {
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState<BaselineComparison | null>(null);
  const [comparingId, setComparingId] = useState<number | null>(null);

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await saveBaseline(label.trim());
      setLabel('');
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleCompare(id: number) {
    setComparingId(id);
    try {
      const result = await compareBaseline(id);
      setComparison(result);
    } catch {
      setComparison(null);
    } finally {
      setComparingId(null);
    }
  }

  async function handleDelete(id: number) {
    await deleteBaseline(id);
    setComparison(null);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Save baseline */}
      <div className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Label (e.g. v1.2-pre-deploy)"
          className="flex-1 rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
        />
        <button
          onClick={handleSave}
          disabled={saving || !label.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Baselines list */}
      {baselines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 px-4 py-6 text-center">
          <GitBranch className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No baselines saved yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Save a snapshot to track performance across deploys.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Label</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TTFT p50</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Convos</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {baselines.map((bl) => (
                <tr key={bl.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-2">
                    <span className="font-medium text-foreground">{bl.label}</span>
                    <span className="text-[10px] text-muted-foreground/60 ml-1.5">{bl.commit_hash?.slice(0, 7)}</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{bl.ttft_e2e_p50_ms?.toFixed(0) ?? '--'} ms</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{bl.conversations}</td>
                  <td className="px-3 py-2 text-muted-foreground/70 text-xs">
                    {new Date(bl.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-0.5">
                      <button
                        onClick={() => handleCompare(bl.id)}
                        disabled={comparingId === bl.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <GitCompare className="w-3 h-3" />
                        {comparingId === bl.id ? '...' : 'Compare'}
                      </button>
                      <button
                        onClick={() => handleDelete(bl.id)}
                        className="inline-flex items-center rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                vs <span className="text-primary">{comparison.baseline_label}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(comparison.baseline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <button onClick={() => setComparison(null)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              Dismiss
            </button>
          </div>

          <div className="rounded-md border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/10">
                  <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Metric</th>
                  <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Current</th>
                  <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Baseline</th>
                  <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Delta</th>
                </tr>
              </thead>
              <tbody>
                {comparison.metrics.map((m) => (
                  <tr key={m.name} className="border-b border-border/20 hover:bg-muted/5">
                    <td className="px-3 py-1.5 flex items-center gap-1.5">
                      <StatusIcon status={m.status} />
                      <span className="text-foreground">{m.name}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-foreground">{m.current.toFixed(1)}{m.unit}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{m.baseline.toFixed(1)}{m.unit}</td>
                    <td className="px-3 py-1.5 text-right"><DeltaText metric={m} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
