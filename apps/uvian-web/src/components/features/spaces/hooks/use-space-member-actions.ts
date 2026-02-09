'use client';

import type { SpaceMemberUI } from '~/lib/domains/spaces/types';
import type { ActionConfig } from '~/components/shared/actions/types/action-manager';
import { UserPlus, Edit, Shield, UserX, Trash2 } from 'lucide-react';
import { spacesActions } from '~/lib/domains/spaces/actions';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { executeMutation } from '~/lib/api/utils';

interface UseSpaceMemberActionsProps {
  spaceId: string;
  members: SpaceMemberUI[] | undefined;
  isAdmin: boolean;
  setSelectedMemberIds: (ids: string[]) => void;
}

interface UseSpaceMemberActionsReturn {
  actionParams: {
    spaceId: string;
    isAdmin: boolean;
  };
  actionConfig: ActionConfig<
    SpaceMemberUI,
    {
      spaceId: string;
      isAdmin: boolean;
    }
  >[];
}

/**
 * Hook that provides action configuration for space member management
 * Extracts the complex action logic from the component for better maintainability
 */
export function useSpaceMemberActions({
  spaceId,
  members,
  isAdmin,
  setSelectedMemberIds,
}: UseSpaceMemberActionsProps): UseSpaceMemberActionsReturn {
  // Action parameters
  const actionParams = {
    spaceId,
    isAdmin,
  };

  // Define actions based on selection state
  const actionConfig: ActionConfig<SpaceMemberUI, typeof actionParams>[] = [
    {
      id: 'invite-member',
      label: 'Invite Member',
      variant: 'prominent',
      group: 'primary',
      visibility: { minSelection: 0, maxSelection: 0 },
      perform: async (selection, params, context) => {
        const profileId = prompt('Enter profile ID to invite:')?.trim();
        if (!profileId) return;

        await executeMutation(
          context.queryClient,
          spacesMutations.inviteSpaceMember(context.queryClient),
          {
            spaceId: params.spaceId,
            profileId,
            role: { name: 'member' },
          }
        );
      },
      icon: UserPlus,
    },
    {
      id: 'edit-member-role',
      label: 'Edit Role',
      variant: 'prominent',
      group: 'primary',
      visibility: { minSelection: 1, maxSelection: 1 },
      perform: async (selection, params, context) => {
        const member = selection.selectedItems[0];
        const newRole = prompt(
          'Enter new role (admin/member):',
          member.role?.name || 'member'
        );
        if (newRole && newRole !== member.role?.name) {
          await executeMutation(
            context.queryClient,
            spacesMutations.updateSpaceMemberRole(context.queryClient),
            {
              spaceId: params.spaceId,
              profileId: member.profileId,
              role: { name: newRole },
            }
          );
        }
      },
      icon: Edit,
    },
    {
      id: 'make-admin',
      label: 'Make Admin',
      variant: 'standard',
      group: 'secondary',
      visibility: {
        minSelection: 1,
        selectionValidator: (selection) => {
          // Only show if at least one selected member is not already an admin
          return selection.selectedItems.some(
            (member) => member.role?.name !== 'admin'
          );
        },
      },
      perform: async (selection, params, context) => {
        const profileIds = selection.selectedItems.map((m) => m.profileId);
        await spacesActions.bulkUpdateMemberRole(
          profileIds,
          { name: 'admin' },
          context,
          params.spaceId
        );
        setSelectedMemberIds([]);
      },
      icon: Shield,
    },
    {
      id: 'make-member',
      label: 'Make Member',
      variant: 'standard',
      group: 'secondary',
      visibility: {
        minSelection: 1,
        selectionValidator: (selection) => {
          // Only show if at least one selected member is an admin
          return selection.selectedItems.some(
            (member) => member.role?.name === 'admin'
          );
        },
      },
      perform: async (selection, params, context) => {
        const profileIds = selection.selectedItems.map((m) => m.profileId);
        await spacesActions.bulkUpdateMemberRole(
          profileIds,
          { name: 'member' },
          context,
          params.spaceId
        );
        setSelectedMemberIds([]);
      },
      icon: UserX,
    },
    {
      id: 'remove-members',
      label: 'Remove Members',
      variant: 'destructive',
      group: 'danger',
      visibility: { minSelection: 1 },
      perform: async (selection, params, context) => {
        const profileIds = selection.selectedItems.map((m) => m.profileId);

        // Confirm before removing
        if (
          confirm(
            `Are you sure you want to remove ${profileIds.length} member(s) from this space?`
          )
        ) {
          await spacesActions.bulkRemoveMembers(
            profileIds,
            context,
            params.spaceId
          );
          setSelectedMemberIds([]);
        }
      },
      icon: Trash2,
      requiresConfirmation: true,
    },
  ];

  return {
    actionParams,
    actionConfig,
  };
}
