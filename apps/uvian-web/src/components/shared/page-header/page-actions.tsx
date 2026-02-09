'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  Share,
  Bookmark,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@org/ui';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui';
import { Button } from '@org/ui';

/**
 * Base PageActions component that provides default generic actions
 * and a slot for page-specific actions to be injected.
 */
export interface PageActionsProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageActions({ children, className }: PageActionsProps) {
  const handleShare = async () => {
    try {
      if (navigator.share && typeof window !== 'undefined') {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // TODO: Show toast notification
        console.log('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleBookmark = async () => {
    // This would integrate with a bookmarks/favorites system
    // For now, we'll just log it
    console.log('Bookmarking page:', window.location.pathname);
    // TODO: Show toast notification
  };

  const handlePrint = () => {
    window.print();
  };

  const handleHelp = () => {
    const helpUrl = `${window.location.origin}/help?page=${encodeURIComponent(
      window.location.pathname
    )}`;
    window.open(helpUrl, '_blank');
  };

  const handlePageSettings = () => {
    // Open a settings modal or navigate to settings page
    console.log('Opening page settings for:', window.location.pathname);
    // TODO: Open settings modal or navigate
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={cn('gap-0', className)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Generic Actions - Tools */}
        <DropdownMenuLabel>Tools</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share className="mr-2 h-4 w-4" />
          <span>Share Page</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
          <Bookmark className="mr-2 h-4 w-4" />
          <span>Bookmark</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
          <Bookmark className="mr-2 h-4 w-4" />
          <span>Print Page</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleHelp} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePageSettings}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Page Settings</span>
        </DropdownMenuItem>

        {/* Separator before page-specific actions */}
        {children && (
          <>
            <DropdownMenuSeparator />
            {/* Page-specific actions will be rendered here */}
            {children}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
