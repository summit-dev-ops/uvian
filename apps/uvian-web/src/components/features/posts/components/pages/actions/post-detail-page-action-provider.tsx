'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { postsMutations } from '~/lib/domains/posts/api/mutations';

export interface PostDetailPageActionContextType {
  spaceId: string;
  postId: string;
  readonly ACTION_DELETE_POST: 'delete-post';
}

interface PostDetailPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  postId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const POST_ACTION_IDS = {
  DELETE_POST: 'delete-post',
} as const;

export function PostDetailPageActionProvider({
  children,
  spaceId,
  postId,
  onError,
  onSuccess,
}: PostDetailPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deletePost } = useMutation(
    postsMutations.deletePost(queryClient)
  );

  const handleDeletePost = React.useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      deletePost(
        { postId },
        {
          onSuccess: () => {
            router.push(`/spaces/${spaceId}/posts`);
            resolve();
          },
          onError: (error) => reject(error),
        }
      );
    });
  }, [deletePost, postId, router, spaceId]);

  const actions: ActionRegistrationType[] = [
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

export function usePostDetailPageActionContext() {
  const context = React.useContext(
    React.createContext<PostDetailPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'usePostDetailPageActionContext must be used within a PostDetailPageActionProvider'
    );
  }
  return context;
}

export { PostDetailPageActions } from './post-detail-page-actions';
