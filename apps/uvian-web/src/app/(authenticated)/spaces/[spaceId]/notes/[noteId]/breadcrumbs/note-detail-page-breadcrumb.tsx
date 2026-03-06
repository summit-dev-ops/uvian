'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { notesQueries } from '~/lib/domains/notes/api';
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
  if (!content) return 'Untitled';
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

export function NoteDetailPageBreadcrumb({
  spaceId,
  noteId,
}: {
  spaceId: string;
  noteId: string;
}) {
  const { data: note, isLoading } = useQuery(
    notesQueries.note(spaceId, noteId)
  );

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
            <Link href={`/spaces/${spaceId}/notes`}>Notes</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              truncateContent(note?.title || 'Note')
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
