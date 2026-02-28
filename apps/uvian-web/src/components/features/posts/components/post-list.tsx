'use client';

import { useSpacePosts } from '../hooks/use-posts';
import { PostItem } from './post-item';

interface PostListProps {
  spaceId: string;
}

export function PostList({ spaceId }: PostListProps) {
  const { posts, isLoading } = useSpacePosts(spaceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-muted-foreground">No posts yet</div>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to post in this space!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostItem key={post.id} post={post} spaceId={spaceId} />
        ))
      )}
    </div>
  );
}
