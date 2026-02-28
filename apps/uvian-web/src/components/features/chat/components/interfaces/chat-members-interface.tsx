'use client';

import React from 'react';
import { useConversationMembers } from '~/components/features/chat/hooks/use-conversation-members';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import { MemberDataTable } from '~/components/features/chat/components/member-data-table';

interface ChatMembersInterfaceProps {
  conversationId: string;
}

export function ChatMembersInterface({
  conversationId,
}: ChatMembersInterfaceProps) {
  const { members, isLoading, removeMember, updateRole } =
    useConversationMembers(conversationId);

  const currentUserMember = members?.find(
    (m) => m.role.name === 'owner' || m.role.name === 'admin'
  );
  const isAdmin =
    currentUserMember?.role.name === 'owner' ||
    currentUserMember?.role.name === 'admin';

  // Early return for loading state
  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Chat Members"
            subtitle="Loading members..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading members..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Chat Members"
            subtitle={`${members?.length || 0} members`}
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <MemberDataTable
            data={members || []}
            isAdmin={isAdmin}
            conversationId={conversationId}
            onRemove={removeMember}
            onUpdateRole={(userId, role) => updateRole(userId, { name: role })}
          />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
