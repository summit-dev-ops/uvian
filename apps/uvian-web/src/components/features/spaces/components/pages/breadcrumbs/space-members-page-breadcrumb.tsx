'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

/**
 * Simple breadcrumb for space members page
 * Shows: Home > Spaces > [Space Name] > Members
 */
export function SpaceMembersPageBreadcrumb({ spaceId }: { spaceId: string }) {
  const {activeProfileId} = useUserSessionStore()
  const { data: space, isLoading } = useQuery(spacesQueries.space(activeProfileId,spaceId));

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
            <Link href="/spaces">Spaces</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <Link href={`/spaces/${spaceId}`}>{space?.name || 'Space'}</Link>
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
