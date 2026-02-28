'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { postsQueries } from '~/lib/domains/posts/api/queries';
import {
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

export function PostDetailPageBreadcrumb({
  spaceId,
  postId,
}: {
  spaceId: string;
  postId: string;
}) {
  const { data: post, isLoading } = useQuery(postsQueries.post(postId));

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
              truncateContent(post?.content || 'Post')
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
