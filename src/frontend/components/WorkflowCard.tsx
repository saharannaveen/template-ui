/** Card component for workflow list display */

import { Card, CardBody, CardTitle, Label } from '@patternfly/react-core';
import { CheckCircle, XCircle, AlertTriangle, Clock, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Workflow } from '../types/workflow';

interface WorkflowCardProps {
  workflow: Workflow;
}

function getStatusIcon(status: Workflow['status']) {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'paused':
      return <Pause className="w-5 h-5 text-yellow-600" />;
    case 'running':
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-gray-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-600" />;
  }
}

function getStatusColor(status: Workflow['status']): 'green' | 'red' | 'orange' | 'blue' | 'grey' {
  switch (status) {
    case 'complete':
      return 'green';
    case 'error':
      return 'red';
    case 'paused':
      return 'orange';
    case 'running':
      return 'blue';
    default:
      return 'grey';
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return `${seconds}s ago`;
  }
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/workflows/${workflow.id}`);
  };

  return (
    <Card
      isClickable
      onClick={handleClick}
      className="hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <CardTitle>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(workflow.status)}
            <span className="font-semibold text-foreground">{workflow.name}</span>
          </div>
          <Label color={getStatusColor(workflow.status)}>
            {workflow.status}
          </Label>
        </div>
      </CardTitle>
      <CardBody>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phase:</span>
            <span className="text-foreground font-medium capitalize">
              {workflow.currentPhase}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost:</span>
            <span className="text-foreground font-medium">
              ${workflow.costUsd.toFixed(2)} / ${workflow.maxCostUsd.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span className="text-foreground font-medium">
              {formatDuration(workflow.timeElapsedMs)}
            </span>
          </div>
          {workflow.iteration > 1 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Iteration:</span>
              <span className="text-foreground font-medium">
                {workflow.iteration}/{workflow.maxIterations}
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
