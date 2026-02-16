import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@org/ui';
import { ProfileSwitcher } from './profile-switcher';
import { SearchForm } from './search-form';

// Navigation data for actual app routes
const data = {
  navMain: [
    {
      title: 'Chats',
      url: '/chats',
      items: [
        {
          title: 'All Conversations',
          url: '/chats',
        },
      ],
    },
    {
      title: 'Support',
      url: '/support',
      items: [
        {
          title: 'Help Center',
          url: '/support',
        },
        {
          title: 'FAQ',
          url: '/support/faq',
        },
        {
          title: 'Search Topics',
          url: '/support/search',
        },
        {
          title: 'Contact Support',
          url: '/support/contact',
        },
      ],
    },
    {
      title: 'Jobs',
      url: '/jobs',
      items: [
        {
          title: 'All Jobs',
          url: '/jobs',
        },
      ],
    },
    {
      title: 'Spaces',
      url: '/spaces',
      items: [
        {
          title: 'All Spaces',
          url: '/spaces',
        },
      ],
    },
    {
      title: 'Profiles',
      url: '/profiles',
      items: [
        {
          title: 'My Profile',
          url: '/profiles',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/settings',
      items: [
        {
          title: 'Account Settings',
          url: '/settings',
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ProfileSwitcher />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
