'use client';

import * as React from 'react';

interface AccountEditPageActionProviderProps {
  children: React.ReactNode;
  accountId: string;
}

export function AccountEditPageActionProvider({
  children,
  accountId,
}: AccountEditPageActionProviderProps) {
  return <>{children}</>;
}
