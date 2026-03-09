'use client';

import * as React from 'react';

interface AccountPageActionProviderProps {
  children: React.ReactNode;
}

export function AccountPageActionProvider({
  children,
}: AccountPageActionProviderProps) {
  return <>{children}</>;
}
