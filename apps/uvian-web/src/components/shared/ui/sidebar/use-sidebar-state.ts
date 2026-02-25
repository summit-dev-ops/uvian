'use client';

import { useSidebar } from '@org/ui';

export function useSidebarState() {
  const { state: outerState } = useSidebar();

  return {
    isOuterExpanded: outerState === 'expanded',
    isOuterCollapsed: outerState === 'collapsed',
  };
}
