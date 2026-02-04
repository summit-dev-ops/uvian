'use client';

import React from 'react';
import Link from 'next/link';
import { useProfile } from '../hooks/use-profile';
import { useProfileEdit } from '../hooks/use-profile-edit';
import { ProfileAvatar } from './ProfileAvatar';
import { Button, Card } from '@org/ui';
import { Calendar, Settings, Edit3, User, Globe, Hash } from 'lucide-react';
import { cn } from '@org/ui';

/**
 * Props for the ProfileView component
 */
interface ProfileViewProps {
  showEditButton?: boolean;
  showSettingsButton?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format public fields for display
 */
function formatPublicFields(
  publicFields: any
): Array<{ key: string; value: any }> {
  if (!publicFields || typeof publicFields !== 'object') {
    return [];
  }

  return Object.entries(publicFields)
    .filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    )
    .map(([key, value]) => ({
      key: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase()),
      value: String(value),
    }));
}

/**
 * ProfileView component for displaying current user profile
 * Shows profile information with edit capabilities
 */
export const ProfileView: React.FC<ProfileViewProps> = ({
  showEditButton = true,
  showSettingsButton = true,
  compact = false,
  className,
}) => {
  const { profile, isLoadingProfile, profileError, hasProfile } = useProfile();

  const { isEditingProfile, startEditingProfile, loadCurrentDataIntoDrafts } =
    useProfileEdit();

  // Handle loading state
  if (isLoadingProfile) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (profileError) {
    return (
      <div className={cn('text-center space-y-4', className)}>
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Error loading profile</h2>
          <p className="text-sm text-muted-foreground">
            {profileError.message ||
              'Something went wrong loading your profile'}
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Handle no profile state (new user)
  if (!hasProfile || !profile) {
    return (
      <div className={cn('text-center space-y-6', className)}>
        <div className="space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Welcome to Uvian</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Complete your profile to personalize your experience and help
              others get to know you.
            </p>
          </div>
        </div>
        <Button
          onClick={() => startEditingProfile()}
          disabled={isEditingProfile}
          className="mx-auto"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Create Profile
        </Button>
      </div>
    );
  }

  const publicFields = formatPublicFields(profile.publicFields);
  const displayName = profile.displayName || 'Anonymous User';

  // Handle compact view for cards/lists
  if (compact) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          displayName={displayName}
          size="sm"
          showBorder={true}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{displayName}</h3>
          {profile.bio && (
            <p className="text-sm text-muted-foreground truncate">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full profile view
  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Header */}
      <div className="flex items-start space-x-6">
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          displayName={displayName}
          size="xl"
          showBorder={true}
          borderColor="border-primary/20"
        />
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile.bio && (
              <p className="text-muted-foreground mt-1">{profile.bio}</p>
            )}
          </div>

          {/* Profile Actions */}
          <div className="flex items-center space-x-3">
            {showEditButton && (
              <Button
                onClick={() => {
                  loadCurrentDataIntoDrafts({
                    displayName: profile.displayName,
                    avatarUrl: profile.avatarUrl,
                    bio: profile.bio,
                    publicFields: profile.publicFields,
                  });
                  startEditingProfile();
                }}
                variant="outline"
                size="sm"
                disabled={isEditingProfile}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {showSettingsButton && (
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Display Name
              </label>
              <p className="text-sm">{displayName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {profile.userId}
                </code>
              </div>
            </div>
            {profile.avatarUrl && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Avatar
                </label>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.avatarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {profile.avatarUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Timestamps */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Activity</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Profile Created
              </label>
              <p className="text-sm">{formatDate(profile.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="text-sm">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </Card>

        {/* Public Fields */}
        {publicFields.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Additional Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {publicFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.key}
                  </label>
                  <p className="text-sm">{field.value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

/**
 * Compact profile view for lists and cards
 */
export const CompactProfileView: React.FC<ProfileViewProps> = (props) => {
  return <ProfileView {...props} compact={true} />;
};
