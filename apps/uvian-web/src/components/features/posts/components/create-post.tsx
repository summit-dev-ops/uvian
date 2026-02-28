'use client';

import { useState } from 'react';
import { Button } from '@org/ui';
import { Textarea } from '@org/ui';
import { useCreatePost } from '../hooks/use-posts';
import { useCurrentUser } from '~/components/features/user/hooks/use-current-user';

interface CreatePostProps {
  spaceId: string;
}

export function CreatePost({ spaceId }: CreatePostProps) {
  const [content, setContent] = useState('');
  const createPost = useCreatePost();
  const { userId } = useCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync({
        id: crypto.randomUUID(),
        spaceId,
        content: content.trim(),
        contentType: 'text',
        userId: userId || '',
      });
      setContent('');
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        rows={3}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || createPost.isPending}
        >
          {createPost.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
