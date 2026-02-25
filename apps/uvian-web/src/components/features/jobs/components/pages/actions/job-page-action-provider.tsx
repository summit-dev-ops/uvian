'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PageActionProvider,
  type ActionRegistrationType,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobMutations } from '~/lib/domains/jobs/api';
// TODO: Import job mutations when available
// import { jobMutations } from '~/lib/domains/jobs/api/mutations';

export interface JobPageActionContextType {
  jobId: string;
  // Pre-defined action IDs for type safety
  readonly ACTION_RETRY_JOB: 'retry-job';
  readonly ACTION_PAUSE_JOB: 'pause-job';
  readonly ACTION_RESUME_JOB: 'resume-job';
  readonly ACTION_CANCEL_JOB: 'cancel-job';
  readonly ACTION_DELETE_JOB: 'delete-job';
  readonly ACTION_VIEW_LOGS: 'view-logs';
}

interface JobPageActionProviderProps {
  children: React.ReactNode;
  jobId: string;
  jobStatus?: string; // To determine which actions are available
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const JOB_ACTION_IDS = {
  RETRY_JOB: 'retry-job',
  PAUSE_JOB: 'pause-job',
  RESUME_JOB: 'resume-job',
  CANCEL_JOB: 'cancel-job',
  DELETE_JOB: 'delete-job',
  VIEW_LOGS: 'view-logs',
} as const;

export function JobPageActionProvider({
  children,
  jobId,
  jobStatus = 'pending',
  onError,
  onSuccess,
}: JobPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  const { mutate: deleteJob } = useMutation(
    jobMutations.deleteJob(queryClient)
  );
  const { mutate: retryJob } = useMutation(jobMutations.retryJob(queryClient));
  const { mutate: cancelJob } = useMutation(
    jobMutations.cancelJob(queryClient)
  );

  // Action handlers - these are the business logic for job operations
  const handleRetry = React.useCallback(async () => {
    if (activeProfileId) {
      try {
        await retryJob({
          authProfileId: activeProfileId,
          jobId,
        });

        console.log(`Retrying job ${jobId} for profile ${activeProfileId}`);
      } catch (error) {
        console.error('Failed to retry job:', error);
        throw error;
      }
    }
  }, [activeProfileId, jobId]);

  const handlePause = React.useCallback(async () => {
    if (
      activeProfileId &&
      (jobStatus === 'running' || jobStatus === 'pending')
    ) {
      try {
        // TODO: Implement actual pause logic
        // await pauseJob({
        //   authProfileId: activeProfileId,
        //   jobId,
        // });

        console.log(`Pausing job ${jobId} for profile ${activeProfileId}`);
      } catch (error) {
        console.error('Failed to pause job:', error);
        throw error;
      }
    } else {
      throw new Error('Job cannot be paused in current status');
    }
  }, [activeProfileId, jobId, jobStatus]);

  const handleResume = React.useCallback(async () => {
    if (activeProfileId && jobStatus === 'paused') {
      try {
        // TODO: Implement actual resume logic
        // await resumeJob({
        //   authProfileId: activeProfileId,
        //   jobId,
        // });

        console.log(`Resuming job ${jobId} for profile ${activeProfileId}`);
      } catch (error) {
        console.error('Failed to resume job:', error);
        throw error;
      }
    } else {
      throw new Error('Job cannot be resumed in current status');
    }
  }, [activeProfileId, jobId, jobStatus]);

  const handleCancel = React.useCallback(async () => {
    if (
      activeProfileId &&
      (jobStatus === 'pending' || jobStatus === 'running')
    ) {
      try {
        // TODO: Implement actual cancel logic
        await cancelJob({
          authProfileId: activeProfileId,
          jobId,
        });

        console.log(`Canceling job ${jobId} for profile ${activeProfileId}`);
      } catch (error) {
        console.error('Failed to cancel job:', error);
        throw error;
      }
    } else {
      throw new Error('Job cannot be canceled in current status');
    }
  }, [activeProfileId, jobId, jobStatus]);

  const handleDelete = React.useCallback(async () => {
    if (activeProfileId) {
      try {
        // TODO: Implement actual delete logic
        await deleteJob({
          authProfileId: activeProfileId,
          jobId,
        });

        console.log(`Deleting job ${jobId} for profile ${activeProfileId}`);

        // Navigate back to jobs list after successful deletion
        router.push('/jobs');
      } catch (error) {
        console.error('Failed to delete job:', error);
        throw error;
      }
    }
  }, [activeProfileId, jobId, router]);

  const handleViewLogs = React.useCallback(async () => {
    // Navigate to job logs view
    router.push(`/jobs/${jobId}/logs`);
  }, [jobId, router]);

  // Determine which actions are available based on job status
  const isRetryable = ['failed', 'error'].includes(jobStatus);
  const isPausable = ['running', 'pending'].includes(jobStatus);
  const isResumable = jobStatus === 'paused';
  const isCancellable = ['pending', 'running'].includes(jobStatus);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: JOB_ACTION_IDS.RETRY_JOB,
      label: 'Retry Job',
      handler: handleRetry,
      loadingLabel: 'Retrying...',
      disabled: !isRetryable,
    },
    {
      id: JOB_ACTION_IDS.PAUSE_JOB,
      label: 'Pause Job',
      handler: handlePause,
      loadingLabel: 'Pausing...',
      disabled: !isPausable,
    },
    {
      id: JOB_ACTION_IDS.RESUME_JOB,
      label: 'Resume Job',
      handler: handleResume,
      loadingLabel: 'Resuming...',
      disabled: !isResumable,
    },
    {
      id: JOB_ACTION_IDS.CANCEL_JOB,
      label: 'Cancel Job',
      handler: handleCancel,
      loadingLabel: 'Canceling...',
      disabled: !isCancellable,
    },
    {
      id: JOB_ACTION_IDS.VIEW_LOGS,
      label: 'View Logs',
      handler: handleViewLogs,
    },
    {
      id: JOB_ACTION_IDS.DELETE_JOB,
      label: 'Delete Job',
      handler: handleDelete,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
  ];

  return (
    <PageActionProvider
      actions={actions}
      onActionError={onError}
      onActionSuccess={onSuccess}
    >
      {children}
    </PageActionProvider>
  );
}
