'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { jobQueries } from '~/lib/domains/jobs/api/queries';
import { jobMutations } from '~/lib/domains/jobs/api/mutations';
import type { JobUI, JobFilters } from '~/lib/domains/jobs/types';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

interface UseJobsTableReturn {
  // Data
  jobs: JobUI[];
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;

  // Action handlers
  onView: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;

  // Data refresh
  refetch: () => void;

  // Selection state
  selectedJobIds: string[];
  setSelectedJobIds: (ids: string[]) => void;
  hasSelection: boolean;
  toggleJobSelection: (jobId: string) => void;
  clearSelection: () => void;

  // Filter state
  filterStatus: string | null;
  filterType: string | null;
  filterDateFrom: Date | null;
  filterDateTo: Date | null;
  setFilterStatus: (status: string | null) => void;
  setFilterType: (type: string | null) => void;
  setFilterDateFrom: (date: Date | null) => void;
  setFilterDateTo: (date: Date | null) => void;
  clearFilters: () => void;
}

/**
 * Main orchestrator hook for job data table
 * Integrates TanStack Query, local state, and mutations
 */
export function useJobsTable(filters?: JobFilters): UseJobsTableReturn {
  const {activeProfileId} = useUserSessionStore()
  const queryClient = useQueryClient();
  const router = useRouter();

  // Local state for selection and filters
  const [selectedJobIds, setSelectedJobIds] = React.useState<string[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = React.useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = React.useState<Date | null>(null);

  // Prepare query filters
  const queryFilters = React.useMemo(() => {
    const dateFrom = filterDateFrom ? filterDateFrom.toISOString() : undefined;
    const dateTo = filterDateTo ? filterDateTo.toISOString() : undefined;

    return {
      ...filters,
      status: (filterStatus as any) || filters?.status,
      type: filterType || filters?.type,
      dateFrom,
      dateTo,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };
  }, [filters, filterStatus, filterType, filterDateFrom, filterDateTo]);

  // Fetch jobs using TanStack Query
  const {
    data: jobResponse,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    ...jobQueries.list({authProfileId: activeProfileId,...queryFilters}),
    enabled: true,
  });

  // Mutations for job actions
  const { mutate: cancelJob } = useMutation(
    jobMutations.cancelJob(queryClient)
  );

  const { mutate: retryJob } = useMutation(jobMutations.retryJob(queryClient));

  const { mutate: deleteJob } = useMutation(
    jobMutations.deleteJob(queryClient)
  );

  // Selection helpers
  const toggleJobSelection = React.useCallback((jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedJobIds([]);
  }, []);

  const hasSelection = selectedJobIds.length > 0;

  // Filter helpers
  const clearFilters = React.useCallback(() => {
    setFilterStatus(null);
    setFilterType(null);
    setFilterDateFrom(null);
    setFilterDateTo(null);
  }, []);

  // Action handlers
  const handleView = React.useCallback(
    (jobId: string) => {
      router.push(`/jobs/${jobId}`);
    },
    [router]
  );

  const handleCancel = React.useCallback(
    (jobId: string) => {
      cancelJob({authProfileId: activeProfileId, jobId });
    },
    [cancelJob, activeProfileId]
  );

  const handleRetry = React.useCallback(
    (jobId: string) => {
      retryJob({authProfileId: activeProfileId, jobId });
    },
    [retryJob, activeProfileId]
  );

  const handleDelete = React.useCallback(
    (jobId: string) => {
      deleteJob({authProfileId: activeProfileId, jobId });
    },
    [deleteJob, activeProfileId]
  );

  // Get jobs from response
  const jobs = jobResponse?.jobs || [];

  return {
    // Data
    jobs,
    isLoading,
    isRefetching,
    error: error as Error | null,

    // Action handlers
    onView: handleView,
    onCancel: handleCancel,
    onRetry: handleRetry,
    onDelete: handleDelete,

    // Data refresh
    refetch,

    // Selection state
    selectedJobIds,
    setSelectedJobIds,
    hasSelection,
    toggleJobSelection,
    clearSelection,

    // Filter state
    filterStatus,
    filterType,
    filterDateFrom,
    filterDateTo,
    setFilterStatus,
    setFilterType,
    setFilterDateFrom,
    setFilterDateTo,
    clearFilters,
  };
}
