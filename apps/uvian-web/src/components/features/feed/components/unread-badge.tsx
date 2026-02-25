'use client';

import { cn } from '@org/ui';
import { useUnreadCount } from '../hooks/use-feed';

interface UnreadBadgeProps {
  className?: string;
}

export function UnreadBadge({ className }: UnreadBadgeProps) {
  const { unreadCount, isLoading } = useUnreadCount();

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium rounded-full bg-primary text-primary-foreground',
        className
      )}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
