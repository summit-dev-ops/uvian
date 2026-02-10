'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@org/ui';

/**
 * Simple breadcrumb for main chat page
 * Shows: Home > Chats > [Conversation Title]
 */
export function ChatPageBreadcrumb({
  conversationId,
}: {
  conversationId: string;
}) {
  const { data: conversation, isLoading } = useQuery(
    chatQueries.conversation(conversationId)
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/chats">Chats</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              conversation?.title || 'Chat'
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
