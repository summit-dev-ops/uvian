'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api';

interface SpaceJobsBreadcrumbProps {
  spaceId: string;
}

export function SpaceJobsBreadcrumb({ spaceId }: SpaceJobsBreadcrumbProps) {
  const { data: space } = useQuery(spacesQueries.space(spaceId));

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link href="/spaces" className="hover:text-foreground transition-colors">
        Spaces
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href={`/spaces/${spaceId}`}
        className="hover:text-foreground transition-colors"
      >
        {space?.name || 'Space'}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">Jobs</span>
    </nav>
  );
}
