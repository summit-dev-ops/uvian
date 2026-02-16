'use client';

import * as React from 'react';
import { LogOut, Download, Trash2, Users } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

const CHAT_ACTION_IDS = {
  LEAVE_CONVERSATION: 'leave-conversation',
  DELETE_CONVERSATION: 'delete-conversation',
  EXPORT_CHAT: 'export-chat',
  SHOW_MEMBERS: 'show-members',
  INVITE_PROFILES: 'invite-profiles',
} as const;

/**
 * Chat page-specific actions component
 * Now uses PageActionContext for all business logic and modal management
 * This is a pure UI component that focuses only on rendering
 */
export function ChatPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleLeave = React.useCallback(async () => {
    // Open confirmation modal for leaving conversation
    modalContext.openModal(MODAL_IDS.CONFIRM_LEAVE);
  }, [modalContext]);

  const handleExport = React.useCallback(async () => {
    // Open export modal
    modalContext.openModal(MODAL_IDS.EXPORT_CHAT);
  }, [modalContext]);

  const handleDelete = React.useCallback(async () => {
    // Open confirmation modal for deleting conversation
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE);
  }, [modalContext]);

  const handleShowMembers = React.useCallback(async () => {
    // Execute the action that navigates to members page
    await actionContext.executeAction(CHAT_ACTION_IDS.SHOW_MEMBERS);
  }, [actionContext]);

  const handleInviteMember = React.useCallback(async () => {
    // Open invite member modal
    modalContext.openModal(MODAL_IDS.INVITE_PROFILES);
  }, [modalContext]);

  return (
    <>
      {/* Chat-specific actions */}
      <DropdownMenuItem
        onClick={handleLeave}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          CHAT_ACTION_IDS.LEAVE_CONVERSATION
        )}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(CHAT_ACTION_IDS.LEAVE_CONVERSATION)
            ? 'Leaving...'
            : 'Leave Conversation'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleExport}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(CHAT_ACTION_IDS.EXPORT_CHAT)}
      >
        <Download className="mr-2 h-4 w-4" />
        <span>Export Chat</span>
      </DropdownMenuItem>

      {/* Member management actions */}
      <DropdownMenuItem
        onClick={handleInviteMember}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          CHAT_ACTION_IDS.INVITE_PROFILES
        )}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Invite Member</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handleShowMembers}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(CHAT_ACTION_IDS.SHOW_MEMBERS)}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Manage Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDelete}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(
          CHAT_ACTION_IDS.DELETE_CONVERSATION
        )}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(CHAT_ACTION_IDS.DELETE_CONVERSATION)
            ? 'Deleting...'
            : 'Delete Conversation'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
