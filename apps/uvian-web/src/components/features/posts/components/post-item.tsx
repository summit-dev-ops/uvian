'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import type { PostUI } from '~/lib/domains/posts/types';

interface PostItemProps {
  post: PostUI;
  spaceId: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PostItem({ post, spaceId }: PostItemProps) {
  const router = useRouter();
  const profile = post.authorProfile;
  const displayName = profile?.displayName ?? 'Loading...';
  const initials = getInitials(profile?.displayName ?? 'U');

  const handleClick = () => {
    router.push(`/spaces/${spaceId}/posts/${post.id}`);
  };

  return (
    <div
      className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          {profile?.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={displayName} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>
    </div>
  );
}
