'use client';

import { Avatar, AvatarFallback } from '@org/ui';
import type { PostUI } from '~/lib/domains/posts/types';

interface PostItemProps {
  post: PostUI;
}

export function PostItem({ post }: PostItemProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">User</span>
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
