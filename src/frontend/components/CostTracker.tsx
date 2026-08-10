import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Progress,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import { DollarSign, TrendingUp, Zap, Clock } from 'lucide-react';

import type { CostUpdate } from '@/types/cost';

export interface CostTrackerProps {
  updates: CostUpdate[];
  maxBudget: number;
  variant?: 'compact' | 'expanded';
}

function getBudgetVariant(percent: number): 'success' | 'warning' | 'danger' {
  if (percent < 50) return 'success';
  if (percent < 80) return 'warning';
  return 'danger';
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

export function CostTracker({
  updates,
  maxBudget,
  variant = 'expanded',
}: Readonly<CostTrackerProps>) {
  const latestUpdate = updates[updates.length - 1];
  const currentCost = latestUpdate?.cumulative_cost_usd ?? 0;
  const budgetRemaining = maxBudget - currentCost;
  const budgetPercent = (currentCost / maxBudget) * 100;
  const budgetVariant = getBudgetVariant(budgetPercent);

  const totalTokensIn = updates.reduce((sum, u) => sum + u.tokens_in, 0);
  const totalTokensOut = updates.reduce((sum, u) => sum + u.tokens_out, 0);
  const totalDuration = updates.reduce((sum, u) => sum + u.duration_seconds, 0);

  const [displayCost, setDisplayCost] = useState(currentCost);

  // Animate cost counter
  useEffect(() => {
    if (currentCost === displayCost) return;

    const startCost = displayCost;
    const endCost = currentCost;
    const duration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newCost = startCost + (endCost - startCost) * progress;
      setDisplayCost(newCost);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentCost, displayCost]);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-sm font-mono text-gray-300 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-400" />
          <span>${displayCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          <span>{formatTokens(totalTokensIn + totalTokensOut)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span>{updates.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-purple-400" />
          <span>{formatDuration(totalDuration)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardBody>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-200">Cost Tracker</span>
            <span className="text-2xl font-mono text-green-400">
              ${displayCost.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Budget Usage</span>
              <span className="font-mono">
                ${currentCost.toFixed(2)} / ${maxBudget.toFixed(2)}
              </span>
            </div>
            <Progress
              value={budgetPercent}
              variant={budgetVariant}
              measureLocation={ProgressMeasureLocation.outside}
              aria-label="Budget usage"
            />
            <div className="text-xs text-gray-400">
              ${budgetRemaining.toFixed(2)} remaining
            </div>
          </div>

          <DescriptionList isHorizontal isCompact className="text-sm">
            <DescriptionListGroup>
              <DescriptionListTerm>Tokens In</DescriptionListTerm>
              <DescriptionListDescription className="font-mono">
                {formatTokens(totalTokensIn)}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Tokens Out</DescriptionListTerm>
              <DescriptionListDescription className="font-mono">
                {formatTokens(totalTokensOut)}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Iterations</DescriptionListTerm>
              <DescriptionListDescription>
                {updates.length}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {formatDuration(totalDuration)}
              </DescriptionListDescription>
            </DescriptionListGroup>

            {latestUpdate && (
              <DescriptionListGroup>
                <DescriptionListTerm>Model</DescriptionListTerm>
                <DescriptionListDescription className="font-mono text-xs">
                  {latestUpdate.model}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </div>
      </CardBody>
    </Card>
  );
}
