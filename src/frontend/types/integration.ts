export type IntegrationProvider = 'github' | 'gitlab' | 'jira' | 'slack';
export type IntegrationStatus = 'connected' | 'not_set' | 'error';

export interface Integration {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  maskedToken?: string;
  defaultOrg?: string;
  instanceUrl?: string;
  channel?: string;
  authMode: 'token' | 'oauth';
  lastTestedAt?: string;
}
