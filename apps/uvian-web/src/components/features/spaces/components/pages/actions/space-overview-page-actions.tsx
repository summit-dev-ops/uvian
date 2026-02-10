'use client';

import * as React from 'react';
import { Edit, Users, Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS } from '~/components/shared/page-actions/modal-registry';
import { usePageActionContext } from '~/components/shared/page-actions/page-action-context';
const SPACE_ACTION_IDS = {
  EDIT_SPACE: 'edit-space',
  INVITE_MEMBERS: 'invite-members',
  MANAGE_MEMBERS: 'manage-members',
  DELETE_SPACE: 'delete-space',
} as const;

/**
 * Space overview page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SpaceOverviewPageActions() {
  const context = usePageActionContext();

  const handleEditSpace = React.useCallback(async () => {
    await context.executeAction(SPACE_ACTION_IDS.EDIT_SPACE);
  }, [context]);

  const handleInviteMembers = React.useCallback(async () => {
    // Open the invite members modal
    context.openModal(MODAL_IDS.INVITE_MEMBERS);
  }, [context]);

  const handleManageMembers = React.useCallback(async () => {
    await context.executeAction(SPACE_ACTION_IDS.MANAGE_MEMBERS);
  }, [context]);

  const handleDeleteSpace = React.useCallback(async () => {
    // Open the delete confirmation modal
    context.openModal(MODAL_IDS.CONFIRM_DELETE);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleEditSpace}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACE_ACTION_IDS.EDIT_SPACE)}
      >
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit Space</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleInviteMembers}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACE_ACTION_IDS.INVITE_MEMBERS)}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Invite Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleManageMembers}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACE_ACTION_IDS.MANAGE_MEMBERS)}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Manage Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDeleteSpace}
        className="cursor-pointer text-destructive"
        disabled={context.isActionExecuting(SPACE_ACTION_IDS.DELETE_SPACE)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(SPACE_ACTION_IDS.DELETE_SPACE)
            ? 'Deleting...'
            : 'Delete Space'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
