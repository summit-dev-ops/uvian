import { SidebarProvider } from '@org/ui';
import { SidebarInset } from '@org/ui';
import { AppSidebar } from '~/components/shared/sidebar/ui/app-sidebar';
import { SiteHeader } from '~/components/shared/sidebar/ui/site-header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col h-dvh min-h-0' >
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className='flex flex-1 min-h-0 relative'>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
