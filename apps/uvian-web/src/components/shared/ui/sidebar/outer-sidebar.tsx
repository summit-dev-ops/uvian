'use client';

import * as React from 'react';
import Link from 'next/link';
import { Home, Compass, Plus, MessageSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api';

interface OuterSidebarProps {
  className?: string;
}

export function OuterSidebar({
  className,
}: OuterSidebarProps): React.ReactNode {
  const [activeItem, setActiveItem] = React.useState<string>('home');

  const { data: spaces = [] } = useQuery(spacesQueries.spaces());

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={`flex flex-col items-center gap-2 py-3 px-1 h-full w-[--sidebar-width-icon] shrink-0 ${
          className || ''
        }`}
      >
        {/* Home */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/home"
              onClick={() => setActiveItem('home')}
              className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                activeItem === 'home'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Home</TooltipContent>
        </Tooltip>

        {/* Explore */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/explore"
              onClick={() => setActiveItem('explore')}
              className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                activeItem === 'explore'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Compass className="h-5 w-5" />
              <span className="sr-only">Explore</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Explore</TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-6 h-px bg-border my-1" />

        {/* Spaces */}
        {spaces.slice(0, 5).map((space) => (
          <Tooltip key={space.id}>
            <TooltipTrigger asChild>
              <Link
                href={`/spaces/${space.id}`}
                onClick={() => setActiveItem(`space-${space.id}`)}
                className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                  activeItem === `space-${space.id}`
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">{space.name}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{space.name}</TooltipContent>
          </Tooltip>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Create Space */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/spaces"
              onClick={() => setActiveItem('create')}
              className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                activeItem === 'create'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Create Space</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Create Space</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
