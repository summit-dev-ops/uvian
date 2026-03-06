'use client';

import * as React from 'react';
import { Edit, Users, Trash2, Plus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS } from '~/components/shared/ui/modals/modal-registry';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext } from '~/components/shared/ui/modals';
import { useSpaceOverviewPageActionContext } from './space-overview-page-action-provider';

const SPACE_ACTION_IDS = {
  EDIT_SPACE: 'edit-space',
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
  MANAGE_MEMBERS: 'manage-members',
  DELETE_SPACE: 'delete-space',
  CREATE_POST: 'create-post',
} as const;

/**
 * Space overview page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SpaceOverviewPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();
  const { spaceId } = useSpaceOverviewPageActionContext();

  const handleCreatePost = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_POST, {
      onConfirmActionId: SPACE_ACTION_IDS.CREATE_POST,
      spaceId,
    });
  }, [modalContext, spaceId]);

  const handleEditSpace = React.useCallback(async () => {
    await actionContext.executeAction(SPACE_ACTION_IDS.EDIT_SPACE);
  }, [actionContext]);

  const handleInviteMembers = React.useCallback(async () => {
    // Open the invite members modal
    modalContext.openModal(MODAL_IDS.INVITE_USER_AS_MEMBER, {
      onConfirmActionId: SPACE_ACTION_IDS.INVITE_USER_AS_MEMBER,
      searchContext: { type: 'space', id: spaceId },
    });
  }, [modalContext, spaceId]);

  const handleManageMembers = React.useCallback(async () => {
    await actionContext.executeAction(SPACE_ACTION_IDS.MANAGE_MEMBERS);
  }, [actionContext]);

  const handleDeleteSpace = React.useCallback(async () => {
    // Open the delete confirmation modal
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirmActionId: SPACE_ACTION_IDS.DELETE_SPACE,
    });
  }, [modalContext]);

  return (
    <>
      <DropdownMenuItem onClick={handleCreatePost} className="cursor-pointer">
        <Plus className="mr-2 h-4 w-4" />
        <span>Create Post</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleEditSpace}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(SPACE_ACTION_IDS.EDIT_SPACE)}
      >
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit Space</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleInviteMembers}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SPACE_ACTION_IDS.INVITE_USER_AS_MEMBER
        )}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Invite Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleManageMembers}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SPACE_ACTION_IDS.MANAGE_MEMBERS
        )}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Manage Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDeleteSpace}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(
          SPACE_ACTION_IDS.DELETE_SPACE
        )}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(SPACE_ACTION_IDS.DELETE_SPACE)
            ? 'Deleting...'
            : 'Delete Space'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
