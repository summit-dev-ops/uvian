'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS } from '~/components/shared/ui/modals/modal-registry';
import { useModalContext } from '~/components/shared/ui/modals';

const POST_ACTION_IDS = {
  CREATE_POST: 'create-post',
} as const;

interface PostsPageActionsProps {
  spaceId: string;
}

export function PostsPageActions({ spaceId }: PostsPageActionsProps) {
  const modalContext = useModalContext();

  const handleCreatePost = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_POST, {
      onConfirmActionId: POST_ACTION_IDS.CREATE_POST,
      spaceId,
    });
  }, [modalContext, spaceId]);

  return (
    <>
      <DropdownMenuItem onClick={handleCreatePost} className="cursor-pointer">
        <Plus className="mr-2 h-4 w-4" />
        <span>Create Post</span>
      </DropdownMenuItem>
    </>
  );
}
