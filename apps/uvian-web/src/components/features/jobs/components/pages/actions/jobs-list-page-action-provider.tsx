'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import { jobKeys, jobMutations } from '~/lib/domains/jobs/api';

export interface JobsListPageActionContextType {
  readonly ACTION_CREATE_JOB: 'create-job';
  readonly ACTION_REFRESH_JOBS: 'refresh-jobs';
}

interface JobsListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const JOBS_LIST_ACTION_IDS = {
  CREATE_JOB: 'create-job',
  REFRESH_JOBS: 'refresh-jobs',
} as const;

export function JobsListPageActionProvider({
  children,
  onError,
  onSuccess,
}: JobsListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  const { mutate: createJob, isPending: isCreating } = useMutation(
    jobMutations.createJob(queryClient)
  );

  // Handler for creating a new job - called by the modal
  const handleJobCreation = React.useCallback(
    async (data: { type: string; resourceScopeId: string; input: any }) => {
      if (!activeProfileId) {
        throw new Error('No active profile ID');
      }

      try {
        await createJob({
          authProfileId: activeProfileId,
          type: data.type,
          input: data.input,
          resourceScopeId: data.resourceScopeId,
        });

        // Simulate job creation for now
        console.log('Creating job:', data);
      } catch (error) {
        console.error('Failed to create job:', error);
        throw error;
      }
    },
    [activeProfileId, createJob]
  );

  // Handler for refresh action
  const handleRefreshJobs = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: jobKeys.all,
    });

    // Simulate refresh for now
    console.log('Refreshing jobs...');
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: JOBS_LIST_ACTION_IDS.CREATE_JOB,
      label: 'New Job',
      handler: handleJobCreation,
      loadingLabel: 'Creating...',
    },
    {
      id: JOBS_LIST_ACTION_IDS.REFRESH_JOBS,
      label: 'Refresh',
      handler: handleRefreshJobs,
    },
  ];

  // Success and error handlers for the PageActionProvider
  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);

      // Special handling for job creation success
      if (actionId === JOBS_LIST_ACTION_IDS.CREATE_JOB) {
        // The UI component will handle modal opening and creation flow
        console.log('Create job action initiated');
      }
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useJobsListPageActionContext() {
  const context = React.useContext(
    React.createContext<JobsListPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useJobsListPageActionContext must be used within a JobsListPageActionProvider'
    );
  }
  return context;
}
