/** Badge showing unread notification count */

import { Badge } from '@patternfly/react-core';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Badge isRead={false} className="ml-2">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
