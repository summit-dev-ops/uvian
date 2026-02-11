'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jobQueries } from '~/lib/domains/jobs/api/queries';
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
 * Breadcrumb for job detail page
 * Shows: Home > Jobs > [Job ID]
 */
export function JobDetailPageBreadcrumb({ jobId }: { jobId: string }) {
  const { isLoading } = useQuery(jobQueries.detail(jobId));

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
            <Link href="/jobs">Jobs</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="font-mono text-sm">
                Job {jobId.substring(0, 8)}...
              </span>
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
