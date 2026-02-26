'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '~/lib/api/api-clients';
import { jobMutations } from '~/lib/domains/jobs/api/mutations';
import type {
  JobUI,
  JobFilters,
  JobListResponseUI,
} from '~/lib/domains/jobs/types';
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
 *
 * @param filters - Supports three modes:
 *   - { spaceId: string } → fetches jobs for that space
 *   - { conversationId: string } → fetches jobs for that conversation
 *   - No scope filter → fetches all jobs (usage/billing view)
 */
export function useJobsTable(filters?: JobFilters): UseJobsTableReturn {
  const { activeProfileId } = useUserSessionStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Local state for selection and filters
  const [selectedJobIds, setSelectedJobIds] = React.useState<string[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = React.useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = React.useState<Date | null>(null);

  // Determine the endpoint based on filters
  const getEndpoint = React.useCallback(() => {
    if (filters?.spaceId) {
      return `/api/spaces/${filters.spaceId}/jobs`;
    }
    if (filters?.conversationId) {
      return `/api/conversations/${filters.conversationId}/jobs`;
    }
    return '/api/jobs/usage';
  }, [filters?.spaceId, filters?.conversationId]);

  // Build query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    if (filterDateFrom) params.dateFrom = filterDateFrom.toISOString();
    if (filterDateTo) params.dateTo = filterDateTo.toISOString();
    params.page = String(filters?.page || 1);
    params.limit = String(filters?.limit || 20);
    return params;
  }, [
    filterStatus,
    filterType,
    filterDateFrom,
    filterDateTo,
    filters?.page,
    filters?.limit,
  ]);

  // Fetch jobs using TanStack Query
  const {
    data: jobResponse,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<JobListResponseUI, Error>({
    queryKey: ['jobs', filters?.spaceId, filters?.conversationId, queryParams],
    queryFn: async () => {
      const { data } = await apiClient.get<JobListResponseUI>(getEndpoint(), {
        params: queryParams,
        headers: { 'x-profile-id': activeProfileId },
      });
      return data;
    },
    enabled: !!activeProfileId,
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

  // Get the base path for navigation
  const getJobPath = React.useCallback(
    (jobId: string) => {
      const job = jobResponse?.jobs.find((j: JobUI) => j.id === jobId);
      if (job?.spaceId) {
        return `/spaces/${job.spaceId}/jobs/${jobId}`;
      }
      if (job?.conversationId) {
        return `/chats/${job.conversationId}/jobs/${jobId}`;
      }
      // Fallback to global jobs page
      return `/jobs/${jobId}`;
    },
    [jobResponse?.jobs]
  );

  // Action handlers
  const handleView = React.useCallback(
    (jobId: string) => {
      router.push(getJobPath(jobId));
    },
    [router, getJobPath]
  );

  const handleCancel = React.useCallback(
    (jobId: string) => {
      cancelJob({ authProfileId: activeProfileId, jobId });
    },
    [cancelJob, activeProfileId]
  );

  const handleRetry = React.useCallback(
    (jobId: string) => {
      retryJob({ authProfileId: activeProfileId, jobId });
    },
    [retryJob, activeProfileId]
  );

  const handleDelete = React.useCallback(
    (jobId: string) => {
      deleteJob({ authProfileId: activeProfileId, jobId });
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
    error,

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
