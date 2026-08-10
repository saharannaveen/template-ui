import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from '@patternfly/react-core';
import { ChevronDown, ChevronUp } from 'lucide-react';

import type { UsageSummary as UsageSummaryType, CostUpdate } from '@/types/cost';

export interface UsageSummaryProps {
  summary: UsageSummaryType;
  iterations?: CostUpdate[];
  compact?: boolean;
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

function getModelShortName(model: string): string {
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return model;
}

export function UsageSummary({
  summary,
  iterations = [],
  compact = false,
}: Readonly<UsageSummaryProps>) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 dark:bg-gray-900 border border-gray-700 font-mono text-sm">
        <span className="text-gray-400">Usage:</span>
        <span className="text-blue-400">{getModelShortName(summary.model)}</span>
        <span className="text-gray-500">|</span>
        <span className="text-green-400">
          {formatTokens(summary.total_tokens_in)}/{formatTokens(summary.total_tokens_out)}
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-yellow-400">${summary.total_cost_usd.toFixed(2)}</span>
        <span className="text-gray-500">|</span>
        <span className="text-purple-400">{summary.iterations} iter</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-300">{formatDuration(summary.duration_seconds)}</span>
      </div>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-200">Usage Summary</span>
            {iterations.length > 0 && (
              <Button
                variant="link"
                onClick={() => setExpanded(!expanded)}
                icon={expanded ? <ChevronUp /> : <ChevronDown />}
              >
                {expanded ? 'Hide' : 'Show'} Iterations
              </Button>
            )}
          </div>

          <DescriptionList isHorizontal isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Model</DescriptionListTerm>
              <DescriptionListDescription className="font-mono text-sm">
                {summary.model}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Total Tokens</DescriptionListTerm>
              <DescriptionListDescription className="font-mono">
                {formatTokens(summary.total_tokens_in)} in / {formatTokens(summary.total_tokens_out)} out
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Total Cost</DescriptionListTerm>
              <DescriptionListDescription className="font-mono text-lg text-green-400">
                ${summary.total_cost_usd.toFixed(2)}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {formatDuration(summary.duration_seconds)}
              </DescriptionListDescription>
            </DescriptionListGroup>

            <DescriptionListGroup>
              <DescriptionListTerm>Iterations</DescriptionListTerm>
              <DescriptionListDescription>
                <div className="flex gap-2 items-center">
                  <span>{summary.iterations} total</span>
                  {summary.iterations_passed > 0 && (
                    <Label color="green">{summary.iterations_passed} passed</Label>
                  )}
                  {summary.iterations_failed > 0 && (
                    <Label color="red">{summary.iterations_failed} failed</Label>
                  )}
                </div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>

          {expanded && iterations.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <div className="text-sm font-semibold text-gray-300 mb-2">
                Per-Iteration Breakdown
              </div>
              <div className="space-y-2">
                {iterations.map((iter) => (
                  <div
                    key={iter.iteration}
                    className="flex items-center justify-between text-sm p-2 rounded bg-gray-900 dark:bg-gray-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-400 w-12">
                        #{iter.iteration}
                      </span>
                      <Label color={iter.status === 'passed' ? 'green' : 'red'}>
                        {iter.status}
                      </Label>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span className="text-gray-400">
                        {formatTokens(iter.tokens_in)}/{formatTokens(iter.tokens_out)}
                      </span>
                      <span className="text-green-400">${iter.cost_usd.toFixed(2)}</span>
                      <span className="text-gray-400">
                        {formatDuration(iter.duration_seconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
