import { useCallback, useEffect, useState } from 'react';
import { Button } from '@patternfly/react-core';
import {
  Github,
  GitBranch,
  MessageSquare,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Integration, IntegrationProvider } from '../../types/integration';
import {
  getIntegrations,
  saveIntegration,
  revokeIntegration,
  testIntegration,
} from '../../services/integrations-api';

interface ProviderConfig {
  provider: IntegrationProvider;
  label: string;
  icon: typeof Github;
  authMode: 'token' | 'oauth';
  tokenLabel?: string;
  tokenPlaceholder?: string;
  extraField?: {
    key: string;
    label: string;
    placeholder: string;
  };
  oauthLabel?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'github',
    label: 'GitHub',
    icon: Github,
    authMode: 'token',
    tokenLabel: 'PAT Token',
    tokenPlaceholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    extraField: {
      key: 'defaultOrg',
      label: 'Default Org',
      placeholder: 'my-org',
    },
  },
  {
    provider: 'gitlab',
    label: 'GitLab',
    icon: GitBranch,
    authMode: 'token',
    tokenLabel: 'PAT Token',
    tokenPlaceholder: 'glpat-xxxxxxxxxxxxxxxxxxxx',
    extraField: {
      key: 'instanceUrl',
      label: 'Instance URL',
      placeholder: 'https://gitlab.com',
    },
  },
  {
    provider: 'jira',
    label: 'Jira (Atlassian)',
    icon: LayoutDashboard,
    authMode: 'oauth',
    oauthLabel: 'Connect via Atlassian',
  },
  {
    provider: 'slack',
    label: 'Slack',
    icon: MessageSquare,
    authMode: 'oauth',
    oauthLabel: 'Connect via OAuth',
  },
];

type CardState = {
  token: string;
  extraValue: string;
  showToken: boolean;
  saving: boolean;
  testing: boolean;
  revoking: boolean;
  testResult: { success: boolean; message: string } | null;
};

function makeInitialCardState(): CardState {
  return {
    token: '',
    extraValue: '',
    showToken: false,
    saving: false,
    testing: false,
    revoking: false,
    testResult: null,
  };
}

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [cardStates, setCardStates] = useState<Record<IntegrationProvider, CardState>>({
    github: makeInitialCardState(),
    gitlab: makeInitialCardState(),
    jira: makeInitialCardState(),
    slack: makeInitialCardState(),
  });

  const updateCard = useCallback(
    (provider: IntegrationProvider, patch: Partial<CardState>) => {
      setCardStates((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], ...patch },
      }));
    },
    [],
  );

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setServiceError(null);
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load integrations';
      if (message.includes('404') || message.includes('502') || message.includes('Session expired')) {
        setServiceError('Integration service unavailable');
      } else {
        setServiceError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIntegrations();
  }, [fetchIntegrations]);

  const getIntegration = (provider: IntegrationProvider): Integration | undefined =>
    integrations.find((i) => i.provider === provider);

  const handleSave = async (config: ProviderConfig) => {
    const state = cardStates[config.provider];
    if (!state.token.trim()) return;

    updateCard(config.provider, { saving: true, testResult: null });

    try {
      const data: Record<string, string> = { token: state.token.trim() };
      if (config.extraField && state.extraValue.trim()) {
        data[config.extraField.key] = state.extraValue.trim();
      }
      await saveIntegration(config.provider, data);
      updateCard(config.provider, { token: '', extraValue: '', showToken: false });
      await fetchIntegrations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      updateCard(config.provider, { testResult: { success: false, message } });
    } finally {
      updateCard(config.provider, { saving: false });
    }
  };

  const handleRevoke = async (provider: IntegrationProvider) => {
    updateCard(provider, { revoking: true, testResult: null });

    try {
      await revokeIntegration(provider);
      await fetchIntegrations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Revoke failed';
      updateCard(provider, { testResult: { success: false, message } });
    } finally {
      updateCard(provider, { revoking: false });
    }
  };

  const handleTest = async (provider: IntegrationProvider) => {
    updateCard(provider, { testing: true, testResult: null });

    try {
      const result = await testIntegration(provider);
      updateCard(provider, { testResult: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      updateCard(provider, { testResult: { success: false, message } });
    } finally {
      updateCard(provider, { testing: false });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading integrations...</p>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive mb-1">{serviceError}</p>
            <p className="text-xs text-muted-foreground">
              The integration service could not be reached. This feature requires the backend
              integration endpoints to be available.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void fetchIntegrations()}>
            Retry
          </Button>
        </div>

        {PROVIDERS.map((config) => (
          <IntegrationCardDisabled key={config.provider} config={config} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Connect external services to enable the agent to interact with your repositories,
          issue trackers, and communication channels.
        </p>
      </div>

      {PROVIDERS.map((config) => {
        const integration = getIntegration(config.provider);
        const state = cardStates[config.provider];
        const isConnected = integration?.status === 'connected';

        return (
          <div
            key={config.provider}
            className="rounded-lg border border-border bg-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <config.icon className="w-5 h-5 text-foreground" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
              </div>
              <StatusBadge status={isConnected ? 'connected' : 'not_set'} />
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
              {config.authMode === 'token' ? (
                <TokenCard
                  config={config}
                  integration={integration}
                  state={state}
                  isConnected={isConnected}
                  onUpdate={updateCard}
                  onSave={() => void handleSave(config)}
                  onRevoke={() => void handleRevoke(config.provider)}
                  onTest={() => void handleTest(config.provider)}
                />
              ) : (
                <OAuthCard
                  config={config}
                  integration={integration}
                  isConnected={isConnected}
                  onRevoke={() => void handleRevoke(config.provider)}
                />
              )}

              {/* Test result feedback */}
              {state.testResult && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                    state.testResult.success
                      ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-destructive/5 border border-destructive/20 text-destructive'
                  }`}
                >
                  {state.testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>{state.testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: 'connected' | 'not_set' | 'error' }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
      Not Set
    </span>
  );
}

function TokenCard({
  config,
  integration,
  state,
  isConnected,
  onUpdate,
  onSave,
  onRevoke,
  onTest,
}: {
  config: ProviderConfig;
  integration: Integration | undefined;
  state: CardState;
  isConnected: boolean;
  onUpdate: (provider: IntegrationProvider, patch: Partial<CardState>) => void;
  onSave: () => void;
  onRevoke: () => void;
  onTest: () => void;
}) {
  if (isConnected && integration) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-24 shrink-0">{config.tokenLabel}:</span>
            <code className="text-xs font-mono text-foreground bg-secondary/50 px-2 py-1 rounded">
              {integration.maskedToken || '********'}
            </code>
          </div>
          {config.extraField && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-24 shrink-0">{config.extraField.label}:</span>
              <span className="text-foreground text-xs">
                {(config.extraField.key === 'defaultOrg'
                  ? integration.defaultOrg
                  : integration.instanceUrl) || 'Not set'}
              </span>
            </div>
          )}
          {integration.lastTestedAt && (
            <p className="text-xs text-muted-foreground">
              Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            isDisabled={!state.token.trim()}
            isLoading={state.saving}
          >
            Update
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onTest}
            isLoading={state.testing}
          >
            Test Connection
          </Button>
          <Button
            variant="plain"
            isDanger
            size="sm"
            onClick={onRevoke}
            isLoading={state.revoking}
          >
            Revoke
          </Button>
        </div>
        {/* Collapsible update field */}
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">
            Enter a new token to update the existing one:
          </p>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={state.showToken ? 'text' : 'password'}
                value={state.token}
                onChange={(e) => onUpdate(config.provider, { token: e.target.value })}
                placeholder={config.tokenPlaceholder}
                aria-label={`New ${config.tokenLabel}`}
                className="w-full rounded-lg px-3 py-2 pr-9 text-sm bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => onUpdate(config.provider, { showToken: !state.showToken })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={state.showToken ? 'Hide token' : 'Show token'}
              >
                {state.showToken ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {config.extraField && (
              <input
                type="text"
                value={state.extraValue}
                onChange={(e) => onUpdate(config.provider, { extraValue: e.target.value })}
                placeholder={config.extraField.placeholder}
                aria-label={config.extraField.label}
                className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{config.tokenLabel}</label>
        <div className="relative">
          <input
            type={state.showToken ? 'text' : 'password'}
            value={state.token}
            onChange={(e) => onUpdate(config.provider, { token: e.target.value })}
            placeholder={config.tokenPlaceholder}
            aria-label={config.tokenLabel ?? 'Token'}
            className="w-full rounded-lg px-3 py-2 pr-9 text-sm bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button
            type="button"
            onClick={() => onUpdate(config.provider, { showToken: !state.showToken })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label={state.showToken ? 'Hide token' : 'Show token'}
          >
            {state.showToken ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {config.extraField && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{config.extraField.label}</label>
          <input
            type="text"
            value={state.extraValue}
            onChange={(e) => onUpdate(config.provider, { extraValue: e.target.value })}
            placeholder={config.extraField.placeholder}
            aria-label={config.extraField.label}
            className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        isDisabled={!state.token.trim()}
        isLoading={state.saving}
        onClick={onSave}
      >
        Connect
      </Button>
    </div>
  );
}

function OAuthCard({
  config,
  integration,
  isConnected,
  onRevoke,
}: {
  config: ProviderConfig;
  integration: Integration | undefined;
  isConnected: boolean;
  onRevoke: () => void;
}) {
  if (isConnected && integration) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Auth:</span>
            <span className="text-foreground text-xs">
              {config.provider === 'jira' ? 'OAuth 2.0 (DCR)' : 'OAuth 2.0'}
            </span>
          </div>
          {integration.channel && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Channel:</span>
              <span className="text-foreground text-xs">{integration.channel}</span>
            </div>
          )}
          {integration.lastTestedAt && (
            <p className="text-xs text-muted-foreground">
              Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button variant="plain" isDanger size="sm" onClick={onRevoke}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Auth:</span>
        <span className="text-foreground text-xs">
          {config.provider === 'jira' ? 'OAuth 2.0 (DCR)' : 'OAuth 2.0'}
        </span>
      </div>
      {config.provider === 'slack' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Channel</label>
          <input
            type="text"
            placeholder="#loop-engineering"
            aria-label="Slack channel"
            disabled
            className="w-full rounded-lg px-3 py-2 text-sm bg-secondary/50 border border-border text-muted-foreground placeholder:text-muted-foreground/50 cursor-not-allowed"
          />
        </div>
      )}
      <Button
        variant="primary"
        size="sm"
        icon={<ExternalLink className="w-3.5 h-3.5" />}
        isDisabled
      >
        {config.oauthLabel}
      </Button>
      <p className="text-xs text-muted-foreground">
        OAuth integration is not yet available. This will redirect to the provider's authorization page once enabled.
      </p>
    </div>
  );
}

function IntegrationCardDisabled({ config }: { config: ProviderConfig }) {
  return (
    <div className="rounded-lg border border-border bg-card opacity-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <config.icon className="w-5 h-5 text-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        </div>
        <StatusBadge status="not_set" />
      </div>
      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground">Service unavailable</p>
      </div>
    </div>
  );
}
