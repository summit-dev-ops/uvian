import { SidebarTrigger, Separator } from '@org/ui';
import {
  BreadcrumbItem,
  DynamicBreadcrumb,
} from '../../navigation/ui/dynamic-breadcrumbs';

const items: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Components', href: '/docs/components' },
  { label: 'Navigation', href: '/docs/components/navigation' },
  { label: 'Breadcrumb' },
];

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumb items={items} />
      </div>
    </header>
  );
}
