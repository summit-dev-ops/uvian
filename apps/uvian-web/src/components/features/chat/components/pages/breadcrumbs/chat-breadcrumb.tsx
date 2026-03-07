'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Home, MessageSquare, ChevronRight } from 'lucide-react';
import {
  useIsMobile,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@org/ui';
import { chatQueries } from '~/lib/domains/chat/api/queries';

/**
 * Simple breadcrumb for main chat page
 * Shows: Home > Chats > [Conversation Title]
 */
export function ChatPageBreadcrumb({
  conversationId,
}: {
  conversationId: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const { data: conversation, isLoading } = useQuery(
    chatQueries.conversation(conversationId)
  );

  const currentPageTitle = conversation?.title || 'Chat';

  if (!isMobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
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
                conversation?.title || 'Chat'
              )}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium hover:text-muted-foreground transition-colors min-h-[44px] px-2 -ml-2 rounded"
        aria-label="View navigation"
      >
        <span className="truncate max-w-[200px]">
          {isLoading ? 'Loading...' : currentPageTitle}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{currentPageTitle}</SheetTitle>
            <SheetDescription>Navigation Path</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Home</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <Link
              href="/chats"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span>Chats</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">
                {isLoading ? 'Loading...' : currentPageTitle}
              </span>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
