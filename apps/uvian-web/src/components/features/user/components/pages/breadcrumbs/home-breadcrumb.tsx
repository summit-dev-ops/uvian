import * as React from 'react';
import { useState } from 'react';
import {
  Home as HomeIcon,
  Compass,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  useIsMobile,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
} from '@org/ui';

const quickLinks = [
  { href: '/home', label: 'Home', icon: HomeIcon },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/chats', label: 'Chats', icon: MessageSquare },
  { href: '/users', label: 'Users', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

export function HomeBreadcrumb() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
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
        aria-label="View quick navigation"
      >
        <HomeIcon className="h-4 w-4" />
        <span>Home</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Quick Navigation</SheetTitle>
            <SheetDescription>Jump to any section</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              const isCurrentPage = link.href === '/home';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentPage ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isCurrentPage ? '' : 'text-muted-foreground'
                    }`}
                  />
                  <span className={isCurrentPage ? 'font-medium' : ''}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
