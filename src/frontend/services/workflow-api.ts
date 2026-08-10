/** API client for Loop Engineering workflows */

import { authenticatedFetch } from './authenticated-fetch';
import type { Workflow, WorkflowAction } from '../types/workflow';

export async function getAllWorkflows(): Promise<Workflow[]> {
  const response = await authenticatedFetch('/api/workflows', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }

  const data = await response.json();
  // Map API fields (snake_case) to UI fields (camelCase)
  return (data.workflows || []).map((w: Record<string, unknown>) => ({
    id: w.workflow_id || '',
    name: w.task_name || '',
    status: w.status || 'running',
    currentPhase: w.current_phase || 'initializing',
    startedAt: w.started_at || '',
    costUsd: w.cost || 0,
    maxCostUsd: 25.0,
    timeElapsedMs: 0,
    model: '',
    iteration: w.iterations || 0,
    maxIterations: 5,
    createdBy: w.user_id || 'unknown',
    chatId: w.thread_id || '',
    decisions: w.decisions || [],
    artifacts: w.artifacts || [],
  })) as Workflow[];
}

export async function getWorkflowDetail(workflowId: string): Promise<Workflow> {
  const response = await authenticatedFetch(`/api/workflows/${workflowId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow detail: ${response.statusText}`);
  }

  const data = await response.json();
  return data.workflow;
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
