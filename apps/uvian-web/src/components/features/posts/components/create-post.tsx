'use client';

import { useState } from 'react';
import { Button } from '@org/ui';
import { Textarea } from '@org/ui';
import { useCreatePost } from '../hooks/use-posts';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

interface CreatePostProps {
  spaceId: string;
}

export function CreatePost({ spaceId }: CreatePostProps) {
  const [content, setContent] = useState('');
  const createPost = useCreatePost();
  const { activeProfileId } = useUserSessionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeProfileId) return;

    try {
      await createPost.mutateAsync({
        authProfileId: activeProfileId,
        spaceId,
        content: content.trim(),
        contentType: 'text',
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
          disabled={!content.trim() || createPost.isPending || !activeProfileId}
        >
          {createPost.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
