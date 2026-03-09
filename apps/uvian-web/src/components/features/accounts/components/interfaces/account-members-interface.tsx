'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountQueries } from '~/lib/domains/accounts';
import type { AccountMemberUI } from '~/lib/domains/accounts/types';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceEmpty,
  InterfaceLoadingSkeleton,
  InterfaceError,
} from '~/components/shared/ui/interfaces';
import { Button } from '@org/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import { MoreHorizontal } from 'lucide-react';

interface AccountMembersInterfaceProps {
  accountId: string;
}

export function AccountMembersInterface({
  accountId,
}: AccountMembersInterfaceProps) {
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery(accountQueries.members(accountId));

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Account Members"
            subtitle="Error loading members"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Members"
            message={error.message || 'Something went wrong. Please try again.'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Account Members"
            subtitle="Loading..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <InterfaceLoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Account Members"
            subtitle={`${members.length} member${
              members.length !== 1 ? 's' : ''
            }`}
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  accountId={accountId}
                />
              ))}
            </div>
          ) : (
            <InterfaceEmpty
              title="No members found"
              message="Add members to this account."
            />
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}

interface MemberListItemProps {
  member: AccountMemberUI;
  accountId: string;
}

function MemberListItem({ member }: MemberListItemProps) {
  const initials =
    member.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{member.displayName || 'Unknown User'}</p>
          <p className="text-sm text-muted-foreground">
            {member.email || 'No email'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm px-2 py-1 bg-muted rounded">
          {member.role.name}
        </span>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
