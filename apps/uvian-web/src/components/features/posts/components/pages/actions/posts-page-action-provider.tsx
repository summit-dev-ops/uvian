'use client';

import * as React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import {
  postsMutations,
  type PostContentPayload,
} from '~/lib/domains/posts/api/mutations';
import { useCurrentUser } from '~/components/features/user/hooks/use-current-user';

export interface PostsPageActionContextType {
  spaceId: string;
  readonly ACTION_CREATE_POST: 'create-post';
  readonly ACTION_DELETE_POST: 'delete-post';
}

interface PostsPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const POST_ACTION_IDS = {
  CREATE_POST: 'create-post',
  DELETE_POST: 'delete-post',
} as const;

export function PostsPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: PostsPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const { mutate: createPost } = useMutation(
    postsMutations.createPost(queryClient)
  );

  const { mutate: deletePost } = useMutation(
    postsMutations.deletePost(queryClient)
  );

  const handleCreatePost = React.useCallback(
    async (data: { spaceId: string; contents: PostContentPayload[] }) => {
      return new Promise<void>((resolve, reject) => {
        createPost(
          {
            id: crypto.randomUUID(),
            spaceId: data.spaceId,
            userId: userId || '',
            contents: data.contents,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    },
    [createPost]
  );

  const handleDeletePost = React.useCallback(
    async (data: { postId: string }) => {
      return new Promise<void>((resolve, reject) => {
        deletePost(
          {
            postId: data.postId,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    },
    [deletePost]
  );

  const actions: ActionRegistrationType[] = [
    {
      id: POST_ACTION_IDS.CREATE_POST,
      label: 'Create Post',
      handler: handleCreatePost,
    },
    {
      id: POST_ACTION_IDS.DELETE_POST,
      label: 'Delete Post',
      handler: handleDeletePost,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
  ];

  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function usePostsPageActionContext() {
  const context = React.useContext(
    React.createContext<PostsPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'usePostsPageActionContext must be used within a PostsPageActionProvider'
    );
  }
  return context;
}
