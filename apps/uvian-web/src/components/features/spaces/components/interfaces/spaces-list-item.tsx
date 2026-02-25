'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui';
import { Item, ItemContent, ItemTitle, ItemDescription } from '@org/ui';
import type { SpaceUI } from '~/lib/domains/spaces/types';

export interface SpacesListItemProps {
  space: SpaceUI;
  onEdit?: (space: SpaceUI) => void;
  onDelete?: (space: SpaceUI) => void;
}

export function SpacesListItem({
  space,
  onEdit,
  onDelete,
}: SpacesListItemProps) {
  return (
    <Item asChild>
      <Link href={`/spaces/${space.id}`} className="group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            {space.avatarUrl ? (
              <AvatarImage src={space.avatarUrl} alt={space.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {space.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <ItemContent className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ItemTitle className="truncate">{space.name}</ItemTitle>
              {space.isPrivate && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
            <ItemDescription className="truncate">
              {space.description ||
                `${space.memberCount || 0} members · ${
                  space.conversationCount || 0
                } conversations`}
            </ItemDescription>
          </ItemContent>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{space.memberCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{space.conversationCount || 0}</span>
          </div>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              space.userRole === 'admin' || space.userRole === 'owner'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
              suppressHydrationWarning
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(space);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(space);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </Item>
  );
}
