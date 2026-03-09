'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import { usePost } from '../../hooks/use-posts';
import { useProfilesByUserId } from '~/components/features/user/hooks/use-profiles-by-user';
import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceContent,
  InterfaceLoading,
  InterfaceError,
} from '~/components/shared/ui/interfaces';
import { PostDetailCarousel } from '../post-item/post-detail-carousel';

interface PostDetailInterfaceProps {
  spaceId: string;
  postId: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PostDetailInterface({
  spaceId,
  postId,
}: PostDetailInterfaceProps) {
  const { post, isLoading, error } = usePost(postId);

  const userIds = post?.userId ? [post.userId] : [];
  const { profiles } = useProfilesByUserId(userIds);

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceLoading message="Loading post..." />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  if (error || !post) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceError
            title="Post not found"
            message={error?.message || 'Unable to load post'}
          />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  const profile = profiles[post.userId];
  const displayName = profile?.displayName ?? 'Unknown';
  const initials = getInitials(profile?.displayName ?? 'U');

  return (
    <InterfaceLayout>
      <InterfaceContainer variant="minimal">
        <InterfaceContent>
          <div className="flex flex-col gap-4">
            <div className="space-y-4">
              <PostDetailCarousel
                spaceId={spaceId}
                contents={post.contents || []}
              />
              <div className="flex items-center gap-3 max-w-3xl mx-auto">
                <Avatar className="h-10 w-10">
                  {profile?.avatarUrl && (
                    <AvatarImage src={profile.avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimestamp(post.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Conversation coming soon
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Discussion thread will be available here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
