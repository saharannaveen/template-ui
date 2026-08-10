/** Single workflow detail with SDLC stepper, decision log, artifacts, and actions */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Button, Alert } from '@patternfly/react-core';
import { ArrowLeft, DollarSign, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchWorkflowDetail,
  selectActiveWorkflow,
  selectWorkflowsLoading,
  selectWorkflowsError,
  clearActiveWorkflow,
} from '../redux/slices/workflows';
import { addToast } from '../redux/slices/toasts';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { WorkflowDecisionLog } from '../components/WorkflowDecisionLog';
import { WorkflowArtifacts } from '../components/WorkflowArtifacts';
import { WorkflowActions } from '../components/WorkflowActions';
import { sendWorkflowAction } from '../services/workflow-api';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function WorkflowDetailPage() {
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const workflow = useAppSelector(selectActiveWorkflow);
  const loading = useAppSelector(selectWorkflowsLoading);
  const error = useAppSelector(selectWorkflowsError);

  useEffect(() => {
    if (workflowId) {
      dispatch(fetchWorkflowDetail(workflowId));
    }

    return () => {
      dispatch(clearActiveWorkflow());
    };
  }, [workflowId, dispatch]);

  const handleAction = async (action: 'pause' | 'cancel' | 'intervene' | 'open-chat', feedback?: string) => {
    if (!workflow) return;

    if (action === 'open-chat') {
      if (workflow.chatId) {
        navigate(`/chat/${workflow.chatId}`);
      }
      return;
    }

    try {
      await sendWorkflowAction(workflow.id, { type: action, feedback });
      dispatch(addToast({
        title: 'Action sent',
        message: `Workflow ${action} action sent successfully`,
        variant: 'success',
      }));
      // Refresh workflow detail
      dispatch(fetchWorkflowDetail(workflow.id));
    } catch (err) {
      dispatch(addToast({
        title: 'Action failed',
        message: err instanceof Error ? err.message : 'Failed to send workflow action',
        variant: 'danger',
      }));
    }
  };

  if (loading && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Spinner size="lg" aria-label="Loading workflow" />
        <p className="text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl text-destructive font-bold">Error</h1>
        <p className="text-destructive">{error}</p>
        <Button variant="danger" onClick={() => dispatch(fetchWorkflowDetail(workflowId))}>
          Retry
        </Button>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl text-muted-foreground font-bold">Workflow Not Found</h1>
        <p className="text-muted-foreground">The requested workflow could not be found.</p>
        <Button variant="primary" onClick={() => navigate('/workflows')}>
          Back to Workflows
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-4">
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/workflows')}
          icon={<ArrowLeft className="w-4 h-4" />}
          className="mb-3"
        >
          Back to Workflows
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{workflow.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Started by {workflow.createdBy}</span>
              <span>•</span>
              <span>{new Date(workflow.startedAt).toLocaleString()}</span>
              {workflow.chatId && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => navigate(`/chat/${workflow.chatId}`)}
                    className="text-primary hover:underline"
                  >
                    from Chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Phase Stepper */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <WorkflowStepper currentPhase={workflow.currentPhase} />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cost</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                ${workflow.costUsd.toFixed(2)} / ${workflow.maxCostUsd.toFixed(2)}
              </p>
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min((workflow.costUsd / workflow.maxCostUsd) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Time Elapsed</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatDuration(workflow.timeElapsedMs)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Iteration</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {workflow.iteration} / {workflow.maxIterations}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Model: {workflow.model}</p>
            </div>
          </div>

          {/* Error Alert */}
          {workflow.status === 'error' && workflow.errorMessage && (
            <Alert variant="danger" title="Workflow Error" isInline>
              {workflow.errorMessage}
            </Alert>
          )}

          {/* Decision Log */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <WorkflowDecisionLog decisions={workflow.decisions} />
          </div>

          {/* Artifacts */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <WorkflowArtifacts artifacts={workflow.artifacts} />
          </div>

          {/* Actions */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <WorkflowActions workflow={workflow} onAction={handleAction} />
          </div>
        </div>
      </div>
    </div>
  );
}
