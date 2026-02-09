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

/**
 * Simple breadcrumb for individual space page
 * Shows: Home > Spaces > [Space Name]
 */
export function SpacePageBreadcrumb({ spaceId }: { spaceId: string }) {
  const { data: space, isLoading } = useQuery(spacesQueries.space(spaceId));

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
              space?.name || 'Space'
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
