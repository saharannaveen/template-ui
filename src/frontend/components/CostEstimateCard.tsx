import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Progress,
  ProgressMeasureLocation,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { DollarSign, Zap } from 'lucide-react';

import type { CostEstimate } from '@/types/cost';

export interface CostEstimateCardProps {
  estimate: CostEstimate;
  currentCost?: number;
  maxBudget: number;
  onApprove: () => void;
  onAdjustBudget: () => void;
  onCancel: () => void;
}

function getComplexityColor(
  complexity: CostEstimate['complexity']
): 'green' | 'blue' | 'orange' | 'red' {
  switch (complexity) {
    case 'trivial':
      return 'green';
    case 'simple':
      return 'blue';
    case 'medium':
      return 'orange';
    case 'complex':
      return 'red';
  }
}

function getComplexityLabel(complexity: CostEstimate['complexity']): string {
  return complexity.charAt(0).toUpperCase() + complexity.slice(1);
}

function getBudgetProgressVariant(
  percent: number
): 'success' | 'warning' | 'danger' {
  if (percent < 50) return 'success';
  if (percent < 80) return 'warning';
  return 'danger';
}

export function CostEstimateCard({
  estimate,
  currentCost = 0,
  maxBudget,
  onApprove,
  onAdjustBudget,
  onCancel,
}: Readonly<CostEstimateCardProps>) {
  const budgetPercent = (currentCost / maxBudget) * 100;
  const budgetVariant = getBudgetProgressVariant(budgetPercent);
  const complexityColor = getComplexityColor(estimate.complexity);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardTitle className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-blue-400" />
        Cost Estimate
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Complexity</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color={complexityColor} icon={<Zap />}>
                    {getComplexityLabel(estimate.complexity)}
                  </Label>
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>Estimated Cost</DescriptionListTerm>
                <DescriptionListDescription className="font-mono">
                  ${estimate.estimated_cost_low.toFixed(2)} - $
                  {estimate.estimated_cost_high.toFixed(2)}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>Max Budget</DescriptionListTerm>
                <DescriptionListDescription className="font-mono">
                  ${maxBudget.toFixed(2)}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>Model</DescriptionListTerm>
                <DescriptionListDescription className="font-mono text-sm">
                  {estimate.model}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>Estimated Iterations</DescriptionListTerm>
                <DescriptionListDescription>
                  {estimate.estimated_iterations}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>

          {currentCost > 0 && (
            <StackItem>
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
              </div>
            </StackItem>
          )}
        </Stack>
      </CardBody>
      <CardFooter className="flex gap-2">
        <Button variant="primary" onClick={onApprove}>
          Approve
        </Button>
        <Button variant="secondary" onClick={onAdjustBudget}>
          Adjust Budget
        </Button>
        <Button variant="link" onClick={onCancel} isDanger>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
