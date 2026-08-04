/** Types and reducer for real-time workflow execution overlay. */

export interface WorkflowSubagent {
  id: string;
  subagentType: string;
  label: string;
  status: 'queued' | 'running' | 'complete';
  durationMs: number | null;
}

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'complete';
  subagents: WorkflowSubagent[];
}

export interface WorkflowExecution {
  workflowId: string;
  status: 'running' | 'complete';
  steps: WorkflowStep[];
}

export type WorkflowProgressEvent =
  | { event: 'workflow_start'; data: { workflow_id: string; steps: Array<{ name: string }> } }
  | { event: 'subagent_start'; data: { id: string; subagent_type: string; name: string; step_index?: number } }
  | { event: 'subagent_end'; data: { id: string; duration_ms?: number } }
  | { event: 'workflow_end'; data: { workflow_id: string } };

/**
 * Pure reducer: apply a single WorkflowProgressEvent to produce the next WorkflowExecution state.
 * Returns a new object on every call (immutable).
 */
export function applyWorkflowEvent(
  current: WorkflowExecution | null,
  evt: WorkflowProgressEvent,
): WorkflowExecution {
  switch (evt.event) {
    case 'workflow_start': {
      const steps: WorkflowStep[] = evt.data.steps.map((s) => ({
        name: s.name,
        status: 'pending',
        subagents: [],
      }));
      return {
        workflowId: evt.data.workflow_id,
        status: 'running',
        steps,
      };
    }

    case 'subagent_start': {
      const prev = current ?? { workflowId: '', status: 'running' as const, steps: [] };
      const steps = prev.steps.map((s) => ({ ...s, subagents: [...s.subagents] }));
      const stepIdx = evt.data.step_index ?? Math.max(0, steps.length - 1);

      // Ensure the target step exists
      while (steps.length <= stepIdx) {
        steps.push({ name: `Step ${steps.length + 1}`, status: 'pending', subagents: [] });
      }

      const step = { ...steps[stepIdx], subagents: [...steps[stepIdx].subagents] };
      step.status = 'running';
      step.subagents.push({
        id: evt.data.id,
        subagentType: evt.data.subagent_type,
        label: evt.data.name,
        status: 'running',
        durationMs: null,
      });
      steps[stepIdx] = step;

      return { ...prev, steps };
    }

    case 'subagent_end': {
      const prev = current ?? { workflowId: '', status: 'running' as const, steps: [] };
      const steps = prev.steps.map((step) => {
        const agentIdx = step.subagents.findIndex((sa) => sa.id === evt.data.id);
        if (agentIdx === -1) return step;

        const subagents = step.subagents.map((sa, i) => {
          if (i !== agentIdx) return sa;
          return { ...sa, status: 'complete' as const, durationMs: evt.data.duration_ms ?? null };
        });

        const allDone = subagents.every((sa) => sa.status === 'complete');
        return { ...step, subagents, status: allDone ? ('complete' as const) : step.status };
      });

      return { ...prev, steps };
    }

    case 'workflow_end': {
      const prev = current ?? { workflowId: evt.data.workflow_id, status: 'complete' as const, steps: [] };
      const steps = prev.steps.map((s) => ({
        ...s,
        status: 'complete' as const,
        subagents: s.subagents.map((sa) => ({ ...sa, status: 'complete' as const })),
      }));
      return { ...prev, status: 'complete', steps };
    }

    default:
      return current ?? { workflowId: '', status: 'running', steps: [] };
  }
}
