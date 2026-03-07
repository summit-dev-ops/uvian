'use client';

import * as React from 'react';
import Link from 'next/link';
import { Home, Compass, Plus, MessageSquare } from 'lucide-react';
import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api';

interface MergedSidebarProps {
  children?: React.ReactNode;
}

export function MergedSidebar({ children }: MergedSidebarProps) {
  const { data: spaces = [] } = useQuery(spacesQueries.spaces());

  return (
    <Sidebar
      collapsible="icon"
      className={cn("overflow-hidden !*:data-[sidebar=sidebar]:flex-row ", !children && "!w-[calc(var(--sidebar-width-icon)+1px)]")}
    >
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)+1px)]"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link href="/home">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Home className="h-5 w-5" />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                  <Link href="/home">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Compass className="h-5 w-5" />
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarMenu>
              {/* Spaces */}
              {spaces.slice(0, 5).map((space) => (
                <SidebarMenuItem key={space.id}>
                  <SidebarMenuButton
                    size="lg"
                    asChild
                    className="md:h-8 md:p-0"
                  >
                    <Link href={`/spaces/${space.id}`}>
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Link href="/spaces">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <span className="sr-only">Create Space</span>
          </Link>
        </SidebarFooter>
      </Sidebar>

      {children && (
        <Sidebar collapsible="none" className="flex-1 md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>{children}</SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  );
}
