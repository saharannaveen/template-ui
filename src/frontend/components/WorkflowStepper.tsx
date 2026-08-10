/** Horizontal SDLC phase stepper for workflows */

import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { WorkflowPhase } from '../types/workflow';

interface WorkflowStepperProps {
  currentPhase: WorkflowPhase;
  className?: string;
}

const PHASES: Array<{ key: WorkflowPhase; label: string }> = [
  { key: 'estimate', label: 'Estimate' },
  { key: 'plan', label: 'Plan' },
  { key: 'design', label: 'Design' },
  { key: 'implement', label: 'Implement' },
  { key: 'test', label: 'Test' },
  { key: 'done', label: 'Done' },
];

export function WorkflowStepper({ currentPhase, className = '' }: WorkflowStepperProps) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {PHASES.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={phase.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isComplete
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {phase.label}
              </span>
            </div>
            {index < PHASES.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  isComplete ? 'bg-green-600' : 'bg-gray-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
