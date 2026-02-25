'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, User, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui';
import { Item, ItemContent, ItemTitle, ItemDescription } from '@org/ui';
import type { ProfileUI } from '~/lib/domains/profile/types';

export interface ProfilesListItemProps {
  profile: ProfileUI;
  onEdit?: (profile: ProfileUI) => void;
  onDelete?: (profile: ProfileUI) => void;
}

export function ProfilesListItem({
  profile,
  onEdit,
  onDelete,
}: ProfilesListItemProps) {
  const TypeIcon = profile.type === 'agent' ? Bot : User;

  return (
    <Item asChild>
      <Link href={`/profiles/${profile.id}`} className="group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={profile.avatarUrl || ''}
              alt={profile.displayName}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <ItemContent className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ItemTitle className="truncate">{profile.displayName}</ItemTitle>
              <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {profile.isActive && (
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              )}
            </div>
            {profile.bio && (
              <ItemDescription className="truncate">
                {profile.bio}
              </ItemDescription>
            )}
          </ItemContent>
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
                onEdit?.(profile);
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
                onDelete?.(profile);
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
