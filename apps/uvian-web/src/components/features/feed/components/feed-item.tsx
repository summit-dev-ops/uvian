'use client';

import { cn } from '@org/ui';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { FeedItemUI } from '~/lib/domains/feed/types';

interface FeedItemProps {
  item: FeedItemUI;
  onClick?: (item: FeedItemUI) => void;
}

const typeConfig = {
  post: { icon: FileText, color: 'text-blue-500', label: 'Post' },
  message: { icon: MessageSquare, color: 'text-green-500', label: 'Message' },
  job: { icon: CheckCircle, color: 'text-purple-500', label: 'Job' },
  ticket: { icon: AlertCircle, color: 'text-orange-500', label: 'Ticket' },
};

const eventTypeLabels: Record<string, string> = {
  post_created: 'created a post',
  message_sent: 'sent a message',
  job_completed: 'job completed',
  job_failed: 'job failed',
  job_cancelled: 'job cancelled',
  ticket_created: 'ticket created',
  ticket_resolved: 'ticket resolved',
  ticket_updated: 'ticket updated',
};

export function FeedItem({ item, onClick }: FeedItemProps) {
  const config = typeConfig[item.type] || typeConfig.message;
  const Icon = config.icon;
  const isUnread = !item.readAt;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors',
        isUnread && 'bg-muted/30'
      )}
      onClick={() => onClick?.(item)}
    >
      <div className={cn('mt-1', config.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.actorDisplayName && (
            <span className="font-medium">{item.actorDisplayName}</span>
          )}
          <span className="text-muted-foreground">
            {eventTypeLabels[item.eventType] || item.eventType}
          </span>
        </div>
        {item.payload?.content && (
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {item.payload.content}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
      {isUnread && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
    </div>
  );
}
