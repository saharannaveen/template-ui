/** List of workflow artifacts with view/download buttons */

import { Button } from '@patternfly/react-core';
import { FileText, Code, TestTube, Download, Eye, Loader2, XCircle } from 'lucide-react';
import type { WorkflowArtifact } from '../types/workflow';

interface WorkflowArtifactsProps {
  artifacts: WorkflowArtifact[];
  className?: string;
}

function getArtifactIcon(type: WorkflowArtifact['type']) {
  switch (type) {
    case 'plan':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'design':
      return <FileText className="w-4 h-4 text-purple-600" />;
    case 'code_diff':
      return <Code className="w-4 h-4 text-green-600" />;
    case 'test_results':
      return <TestTube className="w-4 h-4 text-orange-600" />;
    default:
      return <FileText className="w-4 h-4 text-gray-600" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function WorkflowArtifacts({ artifacts, className = '' }: WorkflowArtifactsProps) {
  if (artifacts.length === 0) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        No artifacts yet
      </div>
    );
  }

  const handleView = (artifact: WorkflowArtifact) => {
    window.open(artifact.url, '_blank');
  };

  const handleDownload = (artifact: WorkflowArtifact) => {
    const link = document.createElement('a');
    link.href = artifact.url;
    link.download = artifact.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-2">Artifacts</h3>
      <div className="space-y-2">
        {artifacts.map((artifact) => (
          <div
            key={artifact.id}
            className="flex items-center justify-between gap-3 p-3 rounded-md bg-card border border-border"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getArtifactIcon(artifact.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {artifact.name}
                  </span>
                  {artifact.status === 'pending' && (
                    <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  )}
                  {artifact.status === 'failed' && (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{artifact.type.replace('_', ' ')}</span>
                  {artifact.size && <span>{formatFileSize(artifact.size)}</span>}
                </div>
              </div>
            </div>
            {artifact.status === 'complete' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleView(artifact)}
                  icon={<Eye className="w-4 h-4" />}
                >
                  View
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleDownload(artifact)}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
