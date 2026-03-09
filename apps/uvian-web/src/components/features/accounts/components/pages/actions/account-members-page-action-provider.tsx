'use client';

import * as React from 'react';

interface AccountMembersPageActionProviderProps {
  children: React.ReactNode;
  accountId: string;
}

export function AccountMembersPageActionProvider({
  children,
  accountId,
}: AccountMembersPageActionProviderProps) {
  return <>{children}</>;
}
