'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { postsQueries } from '~/lib/domains/posts/api/queries';
import { Home, Folder, Send, ChevronRight } from 'lucide-react';
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

function truncateContent(content: string, maxLength: number = 30): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

function getPostTitle(
  contents?: Array<{ contentType: string; url?: string | null }>
): string {
  if (!contents || contents.length === 0) return 'Post';

  const first = contents[0];
  switch (first.contentType) {
    case 'note':
      return 'Note';
    case 'asset':
      return 'File';
    case 'external':
      return first.url ? truncateContent(first.url, 20) : 'Link';
    default:
      return 'Post';
  }
}

export function PostDetailPageBreadcrumb({
  spaceId,
  postId,
}: {
  spaceId: string;
  postId: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const { data: post, isLoading } = useQuery(postsQueries.post(postId));

  const currentPageTitle = truncateContent(
    getPostTitle(post?.contents) || 'Post'
  );

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
              <Link href="/spaces">Spaces</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/spaces/${spaceId}`}>Space</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/spaces/${spaceId}/posts`}>Posts</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                truncateContent(getPostTitle(post?.contents) || 'Post')
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
              href="/spaces"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Folder className="h-5 w-5 text-muted-foreground" />
              <span>Spaces</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <Link
              href={`/spaces/${spaceId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Folder className="h-5 w-5 text-muted-foreground" />
              <span>Space</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <Link
              href={`/spaces/${spaceId}/posts`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Send className="h-5 w-5 text-muted-foreground" />
              <span>Posts</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Send className="h-5 w-5" />
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
