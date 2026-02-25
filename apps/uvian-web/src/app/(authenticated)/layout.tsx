'use client';

import { SidebarProvider, SidebarInset } from '@org/ui';
import { OuterSidebar } from '~/components/shared/ui/sidebar/outer-sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh min-h-0 w-dvw min-w-0 ">
      <SidebarProvider className="flex flex-1">
        <OuterSidebar />
        <SidebarInset className="flex flex-1 min-h-0 min-w-0 relative">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
