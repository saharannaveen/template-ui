import {
  Card,
  CardBody,
  CardTitle,
  Label,
} from '@patternfly/react-core';
import { DollarSign } from 'lucide-react';

import type { CostUpdate } from '@/types/cost';

export interface CostHistoryProps {
  iterations: CostUpdate[];
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(0)}s`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = range > 0 ? 100 - ((value - min) / range) * 100 : 50;
    return `${x},${y}`;
  });

  return (
    <svg className="w-24 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className="text-blue-400"
      />
    </svg>
  );
}

export function CostHistory({ iterations }: Readonly<CostHistoryProps>) {
  if (iterations.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-400" />
          Cost History
        </CardTitle>
        <CardBody>
          <div className="text-sm text-gray-400">No iterations recorded yet</div>
        </CardBody>
      </Card>
    );
  }

  const totalCost = iterations[iterations.length - 1]?.cumulative_cost_usd ?? 0;
  const totalTokensIn = iterations.reduce((sum, it) => sum + it.tokens_in, 0);
  const totalTokensOut = iterations.reduce((sum, it) => sum + it.tokens_out, 0);
  const totalDuration = iterations.reduce((sum, it) => sum + it.duration_seconds, 0);

  const cumulativeCosts = iterations.map((it) => it.cumulative_cost_usd);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardTitle className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-blue-400" />
        Cost History
      </CardTitle>
      <CardBody>
        <div className="space-y-4">
          {/* Sparkline chart */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-700">
            <div className="text-sm text-gray-300">Cumulative Cost</div>
            <Sparkline values={cumulativeCosts} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr className="text-left text-gray-400">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4 text-right">Tokens In</th>
                  <th className="pb-2 pr-4 text-right">Tokens Out</th>
                  <th className="pb-2 pr-4 text-right">Cost</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {iterations.map((iter) => (
                  <tr
                    key={iter.iteration}
                    className="border-b border-gray-800 hover:bg-gray-900 dark:hover:bg-gray-950"
                  >
                    <td className="py-2 pr-4 font-mono text-gray-400">
                      {iter.iteration}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-300">
                      {iter.model.split('-').slice(-2).join('-')}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-blue-400">
                      {formatTokens(iter.tokens_in)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-green-400">
                      {formatTokens(iter.tokens_out)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-yellow-400">
                      ${iter.cost_usd.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">
                      <Label color={iter.status === 'passed' ? 'green' : 'red'}>
                        {iter.status}
                      </Label>
                    </td>
                    <td className="py-2 text-right font-mono text-gray-400">
                      {formatDuration(iter.duration_seconds)}
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr className="bg-gray-900 dark:bg-gray-950 font-semibold">
                  <td className="py-2 pr-4 text-gray-300" colSpan={2}>
                    Total
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-blue-400">
                    {formatTokens(totalTokensIn)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-green-400">
                    {formatTokens(totalTokensOut)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-yellow-400">
                    ${totalCost.toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">
                    <Label color="blue">{iterations.length} iterations</Label>
                  </td>
                  <td className="py-2 text-right font-mono text-gray-400">
                    {formatDuration(totalDuration)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
