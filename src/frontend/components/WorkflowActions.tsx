/** Action buttons for workflow control */

import { Button } from '@patternfly/react-core';
import { Pause, XCircle, MessageSquare, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { Workflow } from '../types/workflow';

interface WorkflowActionsProps {
  workflow: Workflow;
  onAction: (action: 'pause' | 'cancel' | 'intervene' | 'open-chat', feedback?: string) => void;
  className?: string;
}

export function WorkflowActions({ workflow, onAction, className = '' }: WorkflowActionsProps) {
  const [showInterveneInput, setShowInterveneInput] = useState(false);
  const [interventionText, setInterventionText] = useState('');

  const isRunning = workflow.status === 'running';
  const isPaused = workflow.status === 'paused';

  const handleIntervene = () => {
    if (interventionText.trim()) {
      onAction('intervene', interventionText.trim());
      setInterventionText('');
      setShowInterveneInput(false);
    }
  };

  const handleOpenChat = () => {
    onAction('open-chat');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {workflow.chatId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenChat}
            icon={<MessageCircle className="w-4 h-4" />}
          >
            Open Source Chat
          </Button>
        )}
        {isRunning && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAction('pause')}
              icon={<Pause className="w-4 h-4" />}
            >
              Pause
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowInterveneInput(!showInterveneInput)}
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Intervene
            </Button>
          </>
        )}
        {(isRunning || isPaused) && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onAction('cancel')}
            icon={<XCircle className="w-4 h-4" />}
          >
            Cancel
          </Button>
        )}
      </div>

      {showInterveneInput && (
        <div className="p-3 rounded-md bg-card border border-border space-y-2">
          <label htmlFor="intervention-input" className="text-sm font-medium text-foreground">
            Provide guidance to the workflow:
          </label>
          <textarea
            id="intervention-input"
            value={interventionText}
            onChange={(e) => setInterventionText(e.target.value)}
            placeholder="E.g., 'Check the date format in the validation function'"
            className="w-full min-h-[80px] p-2 rounded border border-border bg-background text-foreground text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleIntervene}>
              Send Intervention
            </Button>
            <Button variant="link" size="sm" onClick={() => setShowInterveneInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
