'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jobQueries } from '~/lib/domains/jobs/api/queries';
import { Home, Bot, ChevronRight } from 'lucide-react';
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

/**
 * Breadcrumb for job detail page
 * Shows: Home > Jobs > [Job ID]
 */
export function JobDetailPageBreadcrumb({ jobId }: { jobId: string }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const { data: job, isLoading } = useQuery(jobQueries.detail(jobId));

  const currentPageTitle = job?.type
    ? `Job: ${job.type}`
    : `Job ${jobId.substring(0, 8)}...`;

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
              href="/jobs"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Bot className="h-5 w-5 text-muted-foreground" />
              <span>Jobs</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Bot className="h-5 w-5" />
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
