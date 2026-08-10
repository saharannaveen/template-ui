/** Timeline of workflow decisions and events */

import { CheckCircle, XCircle, Edit, MessageSquare } from 'lucide-react';
import type { WorkflowDecision } from '../types/workflow';

interface WorkflowDecisionLogProps {
  decisions: WorkflowDecision[];
  className?: string;
}

function getDecisionIcon(type: WorkflowDecision['type']) {
  switch (type) {
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'modified':
      return <Edit className="w-4 h-4 text-blue-600" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'intervene':
      return <MessageSquare className="w-4 h-4 text-yellow-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-gray-600" />;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function WorkflowDecisionLog({ decisions, className = '' }: WorkflowDecisionLogProps) {
  if (decisions.length === 0) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        No decisions yet
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-2">Decision Log</h3>
      <div className="space-y-2">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="flex items-start gap-3 p-2 rounded-md bg-card border border-border"
          >
            <div className="mt-0.5">{getDecisionIcon(decision.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground capitalize">
                  {decision.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  via {decision.channel}
                </span>
                {decision.user && (
                  <span className="text-xs text-muted-foreground">
                    by {decision.user}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatTimestamp(decision.timestamp)}
                </span>
              </div>
              {decision.message && (
                <p className="text-sm text-foreground mt-1">{decision.message}</p>
              )}
              {decision.feedback && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  Feedback: {decision.feedback}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
