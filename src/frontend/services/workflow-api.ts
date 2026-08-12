/** API client for Loop Engineering workflows */

import { authenticatedFetch } from './authenticated-fetch';
import type { Workflow, WorkflowAction, WorkflowPhase, WorkflowStatus } from '../types/workflow';

/** Map backend phase values to SDLC phases the UI stepper expects. */
function mapBackendPhase(phase: unknown): WorkflowPhase {
  switch (phase) {
    case 'initializing':
    case 'creating_sandbox':
    case 'ready':
      return 'estimate';
    case 'planning':
      return 'plan';
    case 'designing':
      return 'design';
    case 'active':
    case 'implementing':
      return 'implement';
    case 'testing':
      return 'test';
    case 'idle':
    case 'hibernated':
    case 'task_complete':
    case 'complete':
    case 'completed':
      return 'done';
    default:
      return 'implement';
  }
}

/** Map backend status values to the WorkflowStatus union the UI expects. */
function mapBackendStatus(status: unknown): WorkflowStatus {
  switch (status) {
    case 'running':
    case 'active':
    case 'ready':
      return 'running';
    case 'idle':
    case 'hibernated':
      return 'paused';
    case 'failed':
    case 'error':
      return 'error';
    case 'completed':
    case 'complete':
    case 'task_complete':
      return 'complete';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'running';
  }
}

/** Map a single backend workflow record to the UI Workflow type. */
function mapWorkflow(w: Record<string, unknown>): Workflow {
  return {
    id: (w.workflow_id as string) || '',
    name: (w.task_name as string) || '',
    status: mapBackendStatus(w.status),
    currentPhase: mapBackendPhase(w.current_phase),
    startedAt: (w.started_at as string) || '',
    costUsd: (w.cost as number) || 0,
    maxCostUsd: 25.0,
    timeElapsedMs: 0,
    model: '',
    iteration: (w.iterations as number) || 0,
    maxIterations: 5,
    createdBy: (w.user_id as string) || 'unknown',
    chatId: (w.thread_id as string) || '',
    decisions: (w.decisions as Workflow['decisions']) || [],
    artifacts: (w.artifacts as Workflow['artifacts']) || [],
  };
}

export async function getAllWorkflows(): Promise<Workflow[]> {
  const response = await authenticatedFetch('/api/workflows', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.workflows || []).map((w: Record<string, unknown>) => mapWorkflow(w));
}

export async function getWorkflowDetail(workflowId: string): Promise<Workflow> {
  const response = await authenticatedFetch(`/api/workflows/${workflowId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow detail: ${response.statusText}`);
  }

  const w = await response.json();
  return mapWorkflow(w as Record<string, unknown>);
}

export async function sendWorkflowAction(
  workflowId: string,
  action: WorkflowAction
): Promise<void> {
  const response = await authenticatedFetch(`/api/workflows/${workflowId}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    throw new Error(`Failed to send workflow action: ${response.statusText}`);
  }
}
