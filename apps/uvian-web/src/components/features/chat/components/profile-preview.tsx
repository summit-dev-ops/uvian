'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@org/ui';

interface ProfilePreviewProps {
  profileId: string;
  profile?: ProfileUI;
  children: React.ReactNode;
}

export function ProfilePreview({
  profileId,
  children,
}: ProfilePreviewProps) {
  const { data: fullProfile } = useQuery({
    ...profileQueries.profile(profileId),
    enabled:  !!profileId,
  });

  const currentProfile = fullProfile;

  return (
    <HoverCard>
      <HoverCardTrigger>{children}</HoverCardTrigger>
      <HoverCardContent>
        <ProfilePreviewContent profile={currentProfile} profileId={profileId} />
      </HoverCardContent>
    </HoverCard>
  );
}

interface ProfilePreviewContentProps {
  profile?: ProfileUI;
  profileId: string;
}

function ProfilePreviewContent({
  profile,
  profileId,
}: ProfilePreviewContentProps) {
  const displayName = profile?.displayName || 'Unknown Profile';
  const profileType = profile?.type;

  return (
    <div className="space-y-3">
      {/* Profile Header */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={profile?.avatarUrl} />
          <AvatarFallback>{displayName}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{displayName}</div>
          {profileType && (
            <div className="text-xs text-muted-foreground capitalize">
              {profileType}
            </div>
          )}
        </div>
      </div>

      {/* Profile Bio */}
      {profile?.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {profile.bio}
        </p>
      )}

      {/* Profile Metadata */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">ID:</span> {profileId}
        </div>
        {profile?.isActive !== undefined && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Status:</span>{' '}
            <span
              className={profile.isActive ? 'text-green-600' : 'text-red-600'}
            >
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
        {profile?.createdAt && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Joined:</span>{' '}
            {new Date(profile.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
