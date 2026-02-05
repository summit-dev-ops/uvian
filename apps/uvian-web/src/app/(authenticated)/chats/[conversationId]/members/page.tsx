'use client';

import React, { Suspense, use } from 'react';
import { useConversationMembers } from '~/components/features/chat/hooks/use-conversation-members';
import { MemberDataTable } from '~/components/features/chat/components/member-data-table';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import Link from 'next/link';
import { ChevronLeft, UserPlus } from 'lucide-react';

export default function ConversationMembersPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { members, isLoading, isAdmin, removeMember, updateRole } =
    useConversationMembers(conversationId);

  return (
    <div className="container mx-auto py-10 space-y-6">
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
        {isAdmin && (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading members...</div>}>
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                Loading members...
              </div>
            ) : (
              <MemberDataTable
                data={members || []}
                isAdmin={isAdmin}
                onRemove={removeMember}
                onUpdateRole={(userId, role) =>
                  updateRole(userId, { name: role })
                }
              />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
