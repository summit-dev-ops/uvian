'use client';

import * as React from 'react';
import { Sidebar } from '@org/ui';
import { useSidebarState } from './use-sidebar-state';

interface InnerSidebarProps {
  children: React.ReactNode;
}

export function InnerSidebar({ children }: InnerSidebarProps) {
  const { isOuterExpanded } = useSidebarState();

  return (
    <div
      className={`transition-all duration-200 ease-linear overflow-hidden shrink-0 ${
        isOuterExpanded ? 'w-64' : 'w-0'
      }`}
    >
      <Sidebar variant="inset" collapsible="none" className="w-64 border-r">
        {children}
      </Sidebar>
    </div>
  );
}
