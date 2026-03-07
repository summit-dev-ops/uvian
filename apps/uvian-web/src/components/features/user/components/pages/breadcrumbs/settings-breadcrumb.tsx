'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Settings, ChevronRight } from 'lucide-react';
import {
  useIsMobile,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@org/ui';

/**
 * Simple breadcrumb for settings page
 * Shows: Home > Settings
 */
export function SettingsPageBreadcrumb() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const currentPageTitle = 'Settings';

  if (!isMobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium hover:text-muted-foreground transition-colors min-h-[44px] px-2 -ml-2 rounded"
        aria-label="View navigation"
      >
        <span className="text-muted-foreground">{currentPageTitle}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{currentPageTitle}</SheetTitle>
            <SheetDescription>Navigation Path</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Home</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Settings className="h-5 w-5" />
              <span className="font-medium">{currentPageTitle}</span>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
