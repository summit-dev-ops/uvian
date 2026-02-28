'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';

interface ConversationJobsBreadcrumbProps {
  conversationId: string;
}

export function ConversationJobsBreadcrumb({
  conversationId,
}: ConversationJobsBreadcrumbProps) {
  const { data: conversations } = useQuery(chatQueries.conversations());

  const conversation = conversations?.find((c) => c.id === conversationId);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link href="/chats" className="hover:text-foreground transition-colors">
        Chats
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href={`/chats/${conversationId}`}
        className="hover:text-foreground transition-colors"
      >
        {conversation?.title || 'Chat'}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">Jobs</span>
    </nav>
  );
}
