'use client';

import React from 'react';
import { useConversationMembers } from '~/components/features/chat/hooks/use-conversation-members';
import { ScrollArea } from '@org/ui';
import { MemberDataTable } from '~/components/features/chat/components/member-data-table';

interface ChatMembersInterfaceProps {
  conversationId: string;
}

export function ChatMembersInterface({
  conversationId,
}: ChatMembersInterfaceProps) {
  const { members, isLoading, isAdmin, removeMember, updateRole } =
    useConversationMembers(conversationId);

  return (
    <ScrollArea className='flex-1 p-4'>
      {isLoading ? (
        <div className="h-24 flex items-center justify-center">
          Loading members...
        </div>
      ) : (
        <MemberDataTable
          data={members || []}
          isAdmin={isAdmin}
          onRemove={removeMember}
          onUpdateRole={(profileId, role)=>updateRole(profileId, {name: role})}
        />
      )}
    </ScrollArea>
  );
}
