import React from 'react';
import { JobsListInterface } from '~/components/features/jobs/components/interfaces/jobs-list-interface';
import { SpaceJobsBreadcrumb } from './breadcrumb';

interface SpaceJobsPageProps {
  params: Promise<{ spaceId: string }>;
}

export default async function SpaceJobsPage({ params }: SpaceJobsPageProps) {
  const { spaceId } = await params;

  return (
    <JobsListInterface
      spaceId={spaceId}
      BreadcrumbComponent={SpaceJobsBreadcrumb}
    />
  );
}
