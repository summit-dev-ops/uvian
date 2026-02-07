'use client';

import React, { Suspense, use, useState } from 'react';
import { useConversationMembers } from '~/components/features/chat/hooks/use-conversation-members';
import { createArraySelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionManagerProvider } from '~/components/shared/actions/hocs/with-action-manager';
import { chatActions } from '~/lib/domains/chat/actions';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import Link from 'next/link';
import {
  ChevronLeft,
  UserPlus,
  Edit,
  Shield,
  UserX,
  Trash2,
} from 'lucide-react';
import type { ConversationMemberUI } from '~/lib/domains/chat/types';
import type { ActionConfig } from '~/components/shared/actions/types/action-manager';

export default function ConversationMembersPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { members, isLoading, isAdmin, removeMember, updateRole } =
    useConversationMembers(conversationId);

  // Selection state management for the action manager
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Build selection state from selected member IDs
  const selectedMembers = (members || []).filter((member) =>
    selectedMemberIds.includes(member.profileId)
  );
  const selectionState = createArraySelectionState(selectedMembers);

  // Action parameters
  const actionParams = {
    conversationId,
    isAdmin,
  };

  // Define actions based on selection state
  const actionConfig: ActionConfig<
    ConversationMemberUI,
    typeof actionParams
  >[] = [
    {
      id: 'invite-member',
      label: 'Invite Member',
      variant: 'prominent',
      group: 'primary',
      visibility: { minSelection: 0, maxSelection: 0 },
      perform: async (selection, params, context) => {
        console.log(
          'Opening invitation flow for conversation:',
          params.conversationId
        );
        // Here you would typically open an invitation modal or navigate to invitation page
        // For now, we'll just log it
        alert('Opening invitation flow...');
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
        console.log('Editing role for member:', member.profileId);
        // Open role edit modal or navigate to edit page
        const newRole = prompt(
          'Enter new role (admin/member):',
          member.role?.name || 'member'
        );
        if (newRole && newRole !== member.role?.name) {
          await updateRole(member.profileId, { name: newRole });
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
        console.log('Making members admin:', profileIds);
        // Call bulk update role action
        await chatActions.bulkUpdateMemberRole(
          profileIds,
          'admin',
          context,
          params.conversationId
        );
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
        console.log('Making members regular members:', profileIds);
        // Call bulk update role action
        await chatActions.bulkUpdateMemberRole(
          profileIds,
          'member',
          context,
          params.conversationId
        );
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
        console.log('Removing members:', profileIds);

        // Confirm before removing
        if (
          confirm(
            `Are you sure you want to remove ${profileIds.length} member(s) from this conversation?`
          )
        ) {
          await chatActions.bulkRemoveMembers(
            profileIds,
            context,
            params.conversationId
          );
          // Clear selection after successful removal
          setSelectedMemberIds([]);
        }
      },
      icon: Trash2,
      requiresConfirmation: true,
    },
  ];

  // Action manager is handled by ActionManagerProvider component

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/chats/${conversationId}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Conversation Members
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Member List</CardTitle>
              {/* Selection info */}
              {selectionState.hasSelection && (
                <div className="text-sm text-muted-foreground">
                  {selectionState.selectionCount} member(s) selected
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading members...</div>}>
              {isLoading ? (
                <div className="h-24 flex items-center justify-center">
                  Loading members...
                </div>
              ) : (
                <ActionManagerProvider
                  selectionState={selectionState}
                  actionConfig={actionConfig}
                  params={actionParams}
                  showToolbar={true}
                  toolbarProps={{
                    className: 'mb-4',
                    layout: 'horizontal',
                  }}
                >
                  {/* 
                  Note: The current MemberDataTable manages its own selection state internally.
                  For a full integration, we would either:
                  1. Modify the table to expose selection state, or
                  2. Create a custom table that works with our action manager
                  
                  For now, we'll show a simplified member list with checkboxes
                  that integrates with our action manager.
                */}
                  <MemberListWithSelection
                    members={members || []}
                    selectedMemberIds={selectedMemberIds}
                    onSelectionChange={setSelectedMemberIds}
                    isAdmin={isAdmin}
                    onRemoveMember={removeMember}
                    onUpdateMemberRole={updateRole}
                  />
                </ActionManagerProvider>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Simplified member list component with selection integration
 * This demonstrates how the action manager works with selection state
 */
interface MemberListWithSelectionProps {
  members: ConversationMemberUI[];
  selectedMemberIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isAdmin: boolean;
  onRemoveMember: (profileId: string) => void;
  onUpdateMemberRole: (profileId: string, role: any) => void;
}

function MemberListWithSelection({
  members,
  selectedMemberIds,
  onSelectionChange,
  isAdmin,
  onRemoveMember,
  onUpdateMemberRole,
}: MemberListWithSelectionProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(members.map((m) => m.profileId));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectMember = (profileId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedMemberIds, profileId]);
    } else {
      onSelectionChange(selectedMemberIds.filter((id) => id !== profileId));
    }
  };

  const allSelected =
    members.length > 0 && selectedMemberIds.length === members.length;
  const someSelected =
    selectedMemberIds.length > 0 && selectedMemberIds.length < members.length;

  return (
    <div className="space-y-4">
      {/* Selection controls */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-muted-foreground">
          {selectedMemberIds.length > 0
            ? `${selectedMemberIds.length} of ${members.length} selected`
            : 'Select all members'}
        </span>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.profileId}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              selectedMemberIds.includes(member.profileId)
                ? 'bg-primary/5 border-primary/30'
                : 'bg-background'
            }`}
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedMemberIds.includes(member.profileId)}
                onChange={(e) =>
                  handleSelectMember(member.profileId, e.target.checked)
                }
                className="rounded"
              />
              <div>
                <div className="font-medium">{member.profileId}</div>
                <div className="text-sm text-muted-foreground">
                  Role:{' '}
                  <span className="capitalize">
                    {member.role?.name || 'member'}
                  </span>
                  {' • '}
                  Joined: {new Date(member.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Individual action buttons for admins */}
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRole = prompt(
                      'Enter new role (admin/member):',
                      member.role?.name || 'member'
                    );
                    if (newRole && newRole !== member.role?.name) {
                      onUpdateMemberRole(member.profileId, { name: newRole });
                    }
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (
                      confirm(`Remove ${member.profileId} from conversation?`)
                    ) {
                      onRemoveMember(member.profileId);
                    }
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No members found in this conversation.
          </div>
        )}
      </div>
    </div>
  );
}
