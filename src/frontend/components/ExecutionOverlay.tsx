import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

import type { WorkflowExecution, WorkflowStep, WorkflowSubagent } from '@/types/workflow-progress';

export interface ExecutionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  execution: WorkflowExecution | null;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusIcon(status: 'pending' | 'running' | 'complete' | 'queued'): string {
  switch (status) {
    case 'complete':
      return '[done]';
    case 'running':
      return '[..]';
    case 'queued':
      return '( )';
    case 'pending':
    default:
      return '( )';
  }
}

function statusLabel(status: 'pending' | 'running' | 'complete' | 'queued'): string {
  switch (status) {
    case 'complete':
      return 'done';
    case 'running':
      return 'running';
    case 'queued':
      return 'queued';
    case 'pending':
    default:
      return 'pending';
  }
}

function SubagentLine({
  sa,
  isLast,
}: {
  sa: WorkflowSubagent;
  isLast: boolean;
}) {
  const connector = isLast ? '  \\-- ' : '  |-- ';
  const icon = statusIcon(sa.status);
  const duration = sa.status === 'complete' && sa.durationMs != null ? ` ${formatDuration(sa.durationMs)}` : '';
  const label = statusLabel(sa.status);

  return (
    <div
      className={`whitespace-pre ${
        sa.status === 'running'
          ? 'text-blue-400'
          : sa.status === 'complete'
            ? 'text-green-400'
            : 'text-gray-400'
      }`}
    >
      {connector}
      {sa.label}  {icon}{duration || ` ${label}`}
    </div>
  );
}

function StepLine({ step, index }: { step: WorkflowStep; index: number }) {
  const icon = statusIcon(step.status);
  const label = statusLabel(step.status);
  const hasSubagents = step.subagents.length > 0;
  const parallelTag = hasSubagents ? ' (parallel)' : '';

  return (
    <div className="mb-1">
      <div
        className={`whitespace-pre font-semibold ${
          step.status === 'running'
            ? 'text-blue-300'
            : step.status === 'complete'
              ? 'text-green-300'
              : 'text-gray-300'
        }`}
      >
        {icon} Step {index + 1}: {step.name}{parallelTag}    {label}
      </div>
      {step.subagents.map((sa, i) => (
        <SubagentLine key={sa.id} sa={sa} isLast={i === step.subagents.length - 1} />
      ))}
    </div>
  );
}

export function ExecutionOverlay({ isOpen, onClose, execution }: Readonly<ExecutionOverlayProps>) {
  if (!execution) {
    return null;
  }

  const isComplete = execution.status === 'complete';

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Workflow execution progress"
    >
      <ModalHeader title="Workflow Execution" />
      <ModalBody>
        <div
          className="font-mono text-sm leading-relaxed p-4 rounded-md bg-gray-900 overflow-auto max-h-96"
          role="log"
          aria-live="polite"
          aria-label="Workflow steps"
        >
          {execution.steps.length === 0 && (
            <div className="text-gray-400">Waiting for workflow steps...</div>
          )}
          {execution.steps.map((step, i) => (
            <StepLine key={`step-${i}`} step={step} index={i} />
          ))}
          {isComplete && (
            <div className="mt-3 pt-2 border-t border-gray-700 text-green-300 font-semibold">
              Workflow complete
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {isComplete ? 'Close' : 'Minimize'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
