'use client';

import * as React from 'react';
import { Play, Pause, RotateCcw, Trash2, FileText, X } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

export const JOB_ACTION_IDS = {
  RETRY_JOB: 'retry-job',
  PAUSE_JOB: 'pause-job',
  RESUME_JOB: 'resume-job',
  CANCEL_JOB: 'cancel-job',
  DELETE_JOB: 'delete-job',
  VIEW_LOGS: 'view-logs',
} as const;

/**
 * Job page-specific actions component
 * Now uses PageActionContext for all business logic and modal management
 * This is a pure UI component that focuses only on rendering
 */
export function JobPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleRetry = React.useCallback(async () => {
    // Open confirmation modal for retrying job
    modalContext.openModal(MODAL_IDS.CONFIRM_ACTION, {
      onConfirmActionId: JOB_ACTION_IDS.RETRY_JOB,
      title: 'Retry Job',
      description: 'Are you sure you want to retry this job?',
      confirmText: 'Retry Job',
      variant: 'default',
    });
  }, [modalContext]);

  const handlePause = React.useCallback(async () => {
    // Open confirmation modal for pausing job
    modalContext.openModal(MODAL_IDS.CONFIRM_ACTION, {
      onConfirmActionId: JOB_ACTION_IDS.PAUSE_JOB,
      title: 'Pause Job',
      description: 'Are you sure you want to pause this job?',
      confirmText: 'Pause Job',
      variant: 'default',
    });
  }, [modalContext]);

  const handleResume = React.useCallback(async () => {
    // Open confirmation modal for resuming job
    modalContext.openModal(MODAL_IDS.CONFIRM_ACTION, {
      onConfirmActionId: JOB_ACTION_IDS.RESUME_JOB,
      title: 'Resume Job',
      description: 'Are you sure you want to resume this job?',
      confirmText: 'Resume Job',
      variant: 'default',
    });
  }, [modalContext]);

  const handleCancel = React.useCallback(async () => {
    // Open confirmation modal for canceling job
    modalContext.openModal(MODAL_IDS.CONFIRM_ACTION, {
      onConfirmActionId: JOB_ACTION_IDS.CANCEL_JOB,
      title: 'Cancel Job',
      description: 'Are you sure you want to cancel this job?',
      confirmText: 'Cancel Job',
      variant: 'default',
    });
  }, [modalContext]);

  const handleDelete = React.useCallback(async () => {
    // Open confirmation modal for deleting job
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirmActionId: JOB_ACTION_IDS.DELETE_JOB,
    });
  }, [modalContext]);

  const handleViewLogs = React.useCallback(async () => {
    // Execute the action that shows job logs
    await actionContext.executeAction(JOB_ACTION_IDS.VIEW_LOGS);
  }, [actionContext]);

  return (
    <>
      {/* Job execution control actions */}
      <DropdownMenuItem
        onClick={handleRetry}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.RETRY_JOB)}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOB_ACTION_IDS.RETRY_JOB)
            ? 'Retrying...'
            : 'Retry Job'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handlePause}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.PAUSE_JOB)}
      >
        <Pause className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOB_ACTION_IDS.PAUSE_JOB)
            ? 'Pausing...'
            : 'Pause Job'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleResume}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.RESUME_JOB)}
      >
        <Play className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOB_ACTION_IDS.RESUME_JOB)
            ? 'Resuming...'
            : 'Resume Job'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Job management actions */}
      <DropdownMenuItem
        onClick={handleViewLogs}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.VIEW_LOGS)}
      >
        <FileText className="mr-2 h-4 w-4" />
        <span>View Logs</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleCancel}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.CANCEL_JOB)}
      >
        <X className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOB_ACTION_IDS.CANCEL_JOB)
            ? 'Canceling...'
            : 'Cancel Job'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handleDelete}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(JOB_ACTION_IDS.DELETE_JOB)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOB_ACTION_IDS.DELETE_JOB)
            ? 'Deleting...'
            : 'Delete Job'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
