/** Single notification item with icon, message, time, and link */

import { Bell, AlertTriangle, CheckCircle, DollarSign, MessageSquare, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'checkpoint':
      return <Bell className="w-5 h-5 text-blue-600" />;
    case 'struggle':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'completion':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'cost_alert':
      return <DollarSign className="w-5 h-5 text-orange-600" />;
    case 'slack_response':
      return <MessageSquare className="w-5 h-5 text-purple-600" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600" />;
  }
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    navigate(notification.url);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors hover:bg-secondary/50 ${
        notification.read
          ? 'bg-card border-border'
          : 'bg-card border-primary/40'
      }`}
    >
      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium ${notification.read ? 'text-foreground' : 'text-foreground font-semibold'}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
      )}
    </div>
  );
}
