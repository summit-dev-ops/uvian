'use client';

import * as React from 'react';
import { LogOut, Download, Trash2, Users } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@org/ui';
import {
  MODAL_IDS,
  usePageActionContext,
} from '~/components/shared/page-actions/page-action-context';

const CHAT_ACTION_IDS = {
  LEAVE_CONVERSATION: 'leave-conversation',
  DELETE_CONVERSATION: 'delete-conversation',
  EXPORT_CHAT: 'export-chat',
  SHOW_MEMBERS: 'show-members',
  INVITE_MEMBER: 'invite-member',
} as const;

/**
 * Chat page-specific actions component
 * Now uses PageActionContext for all business logic and modal management
 * This is a pure UI component that focuses only on rendering
 */
export function ChatPageActions() {
  const context = usePageActionContext();

  const handleLeave = React.useCallback(async () => {
    // Open confirmation modal for leaving conversation
    context.openModal(MODAL_IDS.CONFIRM_LEAVE);
  }, [context]);

  const handleExport = React.useCallback(async () => {
    // Open export modal
    context.openModal(MODAL_IDS.EXPORT_CHAT);
  }, [context]);

  const handleDelete = React.useCallback(async () => {
    // Open confirmation modal for deleting conversation
    context.openModal(MODAL_IDS.CONFIRM_DELETE);
  }, [context]);

  const handleShowMembers = React.useCallback(async () => {
    // Execute the action that navigates to members page
    await context.executeAction(CHAT_ACTION_IDS.SHOW_MEMBERS);
  }, [context]);

  const handleInviteMember = React.useCallback(async () => {
    // Open invite member modal
    context.openModal(MODAL_IDS.INVITE_MEMBERS);
  }, [context]);

  return (
    <>
      {/* Chat-specific actions */}
      <DropdownMenuItem
        onClick={handleLeave}
        className="cursor-pointer"
        disabled={context.isActionExecuting(CHAT_ACTION_IDS.LEAVE_CONVERSATION)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(CHAT_ACTION_IDS.LEAVE_CONVERSATION)
            ? 'Leaving...'
            : 'Leave Conversation'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleExport}
        className="cursor-pointer"
        disabled={context.isActionExecuting(CHAT_ACTION_IDS.EXPORT_CHAT)}
      >
        <Download className="mr-2 h-4 w-4" />
        <span>Export Chat</span>
      </DropdownMenuItem>

      {/* Member management actions */}
      <DropdownMenuItem
        onClick={handleInviteMember}
        className="cursor-pointer"
        disabled={context.isActionExecuting(CHAT_ACTION_IDS.INVITE_MEMBER)}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Invite Member</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handleShowMembers}
        className="cursor-pointer"
        disabled={context.isActionExecuting(CHAT_ACTION_IDS.SHOW_MEMBERS)}
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Manage Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDelete}
        className="cursor-pointer text-destructive"
        disabled={context.isActionExecuting(
          CHAT_ACTION_IDS.DELETE_CONVERSATION
        )}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(CHAT_ACTION_IDS.DELETE_CONVERSATION)
            ? 'Deleting...'
            : 'Delete Conversation'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
