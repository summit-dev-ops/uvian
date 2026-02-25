'use client';

import * as React from 'react';
import Link from 'next/link';
import { Compass, Hash, Users, Star } from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@org/ui';

interface ExploreSidebarProps {}

export function ExploreSidebar({}: ExploreSidebarProps) {
  const categories = [
    {
      id: 'trending',
      label: 'Trending',
      icon: Star,
      href: '/explore?filter=trending',
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: Compass,
      href: '/explore?filter=recent',
    },
    {
      id: 'popular',
      label: 'Popular',
      icon: Users,
      href: '/explore?filter=popular',
    },
  ];

  const topics = [
    { id: 'ai', label: 'AI & ML', icon: Hash, href: '/explore?topic=ai' },
    {
      id: 'creative',
      label: 'Creative',
      icon: Hash,
      href: '/explore?topic=creative',
    },
    {
      id: 'productivity',
      label: 'Productivity',
      icon: Hash,
      href: '/explore?topic=productivity',
    },
    {
      id: 'gaming',
      label: 'Gaming',
      icon: Hash,
      href: '/explore?topic=gaming',
    },
  ];

  return (
    <>
      <SidebarHeader className="pt-4">
        <div className="px-2">
          <h2 className="text-sm font-semibold">Explore</h2>
          <p className="text-xs text-muted-foreground">
            Discover spaces and agents
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                Categories
              </div>
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton asChild>
                    <Link href={category.href}>
                      <category.icon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                Topics
              </div>
              {topics.map((topic) => (
                <SidebarMenuItem key={topic.id}>
                  <SidebarMenuButton asChild>
                    <Link href={topic.href}>
                      <topic.icon className="h-4 w-4" />
                      <span>{topic.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
