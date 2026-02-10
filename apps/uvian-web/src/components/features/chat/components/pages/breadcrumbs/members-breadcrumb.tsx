'use client';

import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api';

/**
 * Simple breadcrumb for conversation members page
 * Shows: Home > Chats > Chat > Members
 */
export function MembersPageBreadcrumb({
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
        <BreadcrumbItem>
          <BreadcrumbPage>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <Link href={`/chats/${conversationId}`}>{conversation?.title || 'Chat'}</Link>
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Members</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
