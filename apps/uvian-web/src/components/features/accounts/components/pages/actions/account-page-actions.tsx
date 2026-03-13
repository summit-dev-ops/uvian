'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Users } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';

interface AccountPageActionsProps {
  accountId: string;
}

export function AccountPageActions({ accountId }: AccountPageActionsProps) {
  const router = useRouter();

  const handleEdit = React.useCallback(() => {
    router.push(`/accounts/${accountId}/edit`);
  }, [router, accountId]);

  const handleMembers = React.useCallback(() => {
    router.push(`/accounts/${accountId}/members`);
  }, [router, accountId]);

  const handleAgents = React.useCallback(() => {
    router.push(`/accounts/${accountId}/agents`);
  }, [router, accountId]);

  return (
    <>
      <DropdownMenuItem onClick={handleMembers} className="cursor-pointer">
        <Users className="mr-2 h-4 w-4" />
        <span>Members</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handleAgents} className="cursor-pointer">
        <span className="mr-2">🤖</span>
        <span>Agents</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
    </>
  );
}
