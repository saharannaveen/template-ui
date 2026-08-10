/** Types for Loop Engineering workflows */

export type WorkflowStatus = 'running' | 'paused' | 'error' | 'complete' | 'cancelled';

export type WorkflowPhase = 'estimate' | 'plan' | 'design' | 'implement' | 'test' | 'done';

export interface WorkflowDecision {
  id: string;
  type: 'approved' | 'modified' | 'cancelled' | 'intervene';
  timestamp: string;
  channel: 'ui' | 'slack';
  user: string;
  message?: string;
  feedback?: string;
}

export interface WorkflowArtifact {
  id: string;
  type: 'plan' | 'design' | 'code_diff' | 'test_results' | 'other';
  name: string;
  url: string;
  createdAt: string;
  size?: number;
  status?: 'pending' | 'complete' | 'failed';
}

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  currentPhase: WorkflowPhase;
  startedAt: string;
  completedAt?: string;
  costUsd: number;
  maxCostUsd: number;
  timeElapsedMs: number;
  model: string;
  iteration: number;
  maxIterations: number;
  createdBy: string;
  chatId?: string;
  decisions: WorkflowDecision[];
  artifacts: WorkflowArtifact[];
  errorMessage?: string;
}

export interface WorkflowAction {
  type: 'pause' | 'cancel' | 'intervene' | 'approve' | 'modify';
  feedback?: string;
}
