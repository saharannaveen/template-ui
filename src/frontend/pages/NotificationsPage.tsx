/** List of notifications with links to workflows/chats */

import { useEffect } from 'react';
import { Spinner, Button } from '@patternfly/react-core';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchNotifications,
  markAsRead,
  selectAllNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
} from '../redux/slices/notifications';
import { NotificationItem } from '../components/NotificationItem';

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectAllNotifications);
  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Spinner size="lg" aria-label="Loading notifications" />
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl text-destructive font-bold">Error</h1>
        <p className="text-destructive">{error}</p>
        <Button variant="danger" onClick={() => dispatch(fetchNotifications())}>
          Retry
        </Button>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

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
          <Bell className="w-6 h-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Unread ({unreadNotifications.length})
              </h2>
              <div className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Read ({readNotifications.length})
              </h2>
              <div className="space-y-2">
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No notifications yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                You'll be notified when workflows need attention
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
