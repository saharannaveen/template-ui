/** List of running and completed workflows */

import { useEffect } from 'react';
import { Spinner, Button } from '@patternfly/react-core';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchWorkflows,
  selectAllWorkflows,
  selectWorkflowsLoading,
  selectWorkflowsError,
} from '../redux/slices/workflows';
import { WorkflowCard } from '../components/WorkflowCard';
import type { Workflow } from '../types/workflow';

export function WorkflowsListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const workflows = useAppSelector(selectAllWorkflows);
  const loading = useAppSelector(selectWorkflowsLoading);
  const error = useAppSelector(selectWorkflowsError);

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  const runningWorkflows = workflows.filter(
    (w) => w.status === 'running' || w.status === 'paused'
  );
  const completedWorkflows = workflows.filter(
    (w) => w.status === 'complete' || w.status === 'error' || w.status === 'cancelled'
  );

  if (loading && workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Spinner size="lg" aria-label="Loading workflows" />
        <p className="text-muted-foreground">Loading workflows...</p>
      </div>
    );
  }

  if (error && workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl text-destructive font-bold">Error</h1>
        <p className="text-destructive">{error}</p>
        <Button variant="danger" onClick={() => dispatch(fetchWorkflows())}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {runningWorkflows.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                🔄 Running ({runningWorkflows.length})
              </h2>
              <div className="space-y-3">
                {runningWorkflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            </div>
          )}

          {completedWorkflows.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                ✅ Completed ({completedWorkflows.length})
              </h2>
              <div className="space-y-3">
                {completedWorkflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            </div>
          )}

          {workflows.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No workflows yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Start a new workflow from the home page
              </p>
              <Button variant="primary" className="mt-4" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
