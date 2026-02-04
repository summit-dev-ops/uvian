'use client';

import React, { useState } from 'react';
import { Avatar, AvatarImage } from '@org/ui';
import { cn } from '@org/ui';

/**
 * Props for the ProfileAvatar component
 */
interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  fallbackText?: string;
  loading?: boolean;
  onImageError?: () => void;
}

/**
 * Generate a color based on user name for consistent fallback avatars
 */
function generateColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from display name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Size configurations for avatar dimensions
 */
const sizeConfig = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

/**
 * ProfileAvatar component for displaying user avatars with URL support and fallback
 * Uses URL-based avatars as specified (no upload functionality yet)
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  displayName,
  size = 'md',
  className,
  showBorder = false,
  borderColor = 'border-border',
  fallbackText,
  loading = false,
  onImageError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    onImageError?.();
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageLoadStart = () => {
    setIsLoading(true);
  };

  const hasValidImage = avatarUrl && !imageError;
  const initials = getInitials(displayName);
  const fallbackColor = generateColorFromName(displayName);
  const sizeClass = sizeConfig[size];

  return (
    <Avatar
      className={cn(
        'shrink-0 overflow-hidden',
        sizeClass,
        showBorder && `border-2 ${borderColor}`,
        className
      )}
    >
      {hasValidImage ? (
        <>
          <AvatarImage
            src={avatarUrl}
            alt={displayName}
            className="object-cover"
            onError={handleImageError}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="h-1/2 w-1/2 animate-spin rounded-full border border-primary/30 border-t-primary" />
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center text-white font-medium',
            fallbackColor
          )}
        >
          {initials}
        </div>
      )}
    </Avatar>
  );
};

/**
 * Alternative component with loading state and error handling
 */
export const ProfileAvatarWithFallback: React.FC<ProfileAvatarProps> = (
  props
) => {
  return <ProfileAvatar {...props} loading={props.loading} />;
};

/**
 * Simple profile avatar with minimal props for quick usage
 */
export const SimpleProfileAvatar: React.FC<{
  avatarUrl?: string | null;
  name: string;
  size?: ProfileAvatarProps['size'];
  className?: string;
}> = ({ avatarUrl, name, size = 'md', className }) => {
  return (
    <ProfileAvatar
      avatarUrl={avatarUrl}
      displayName={name}
      size={size}
      className={className}
    />
  );
};
