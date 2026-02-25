'use client';

import Link from 'next/link';
import { MessageSquare, Folder, User, Cog, Bot } from 'lucide-react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { HomeBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs/home-breadcrumb';
import { ModalProvider } from '~/components/shared/ui/modals';

const navItems = [
  {
    title: 'Conversations',
    href: '/chats',
    icon: MessageSquare,
    description: 'Your chat conversations',
  },
  {
    title: 'Spaces',
    href: '/spaces',
    icon: Folder,
    description: 'Manage your spaces',
  },
  {
    title: 'Profiles',
    href: '/profiles',
    icon: User,
    description: 'Manage your profiles',
  },
  {
    title: 'Jobs',
    href: '/jobs',
    icon: Bot,
    description: 'View and manage jobs',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Cog,
    description: 'Account settings',
  },
];

export default function HomePage() {
  return (
    <ModalProvider>
      <PageContainer
        size="full"
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <HomeBreadcrumb />
          <PageActions />
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-start gap-2 p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="h-8 w-8 mb-2" />
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </PageContent>
      </PageContainer>
    </ModalProvider>
  );
}
