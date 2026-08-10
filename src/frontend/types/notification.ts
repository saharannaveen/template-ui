/** Types for Loop Engineering notifications */

export type NotificationType =
  | 'checkpoint'
  | 'struggle'
  | 'completion'
  | 'cost_alert'
  | 'slack_response'
  | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  workflowId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  url: string;
  icon?: string;
}
