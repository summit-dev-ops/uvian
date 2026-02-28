'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, ItemGroup } from '@org/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spacesQueries, spacesMutations } from '~/lib/domains/spaces/api';
import type { SpaceUI } from '~/lib/domains/spaces/types';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceEmpty,
  InterfaceLoadingSkeleton,
  InterfaceError,
} from '~/components/shared/ui/interfaces';
import { SpacesListItem } from './spaces-list-item';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

export function SpacesListInterface() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useModalContext();

  const {
    data: spaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery(spacesQueries.spaces());

  const { data: stats } = useQuery(spacesQueries.spaceStats());

  const { mutate: deleteSpace } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  const handleCreateSpace = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_SPACE, {
      onConfirmActionId: 'create-space',
    });
  }, [modalContext]);

  const handleEditSpace = React.useCallback(
    (space: SpaceUI) => {
      router.push(`/spaces/${space.id}/edit`);
    },
    [router]
  );

  const handleDeleteSpace = React.useCallback(
    (space: SpaceUI) => {
      modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
        onConfirm: () => {
          deleteSpace({ spaceId: space.id });
        },
        title: 'Delete Space',
        description: `Are you sure you want to delete "${space.name}"? This will also delete all conversations in this space.`,
      });
    },
    [deleteSpace, modalContext]
  );

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Spaces"
            subtitle="Error loading spaces"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Spaces"
            message={error.message || 'Something went wrong. Please try again.'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Spaces" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <InterfaceLoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Spaces"
            subtitle={
              stats
                ? `${stats.totalSpaces} spaces · ${stats.totalConversations} conversations`
                : `${spaces.length} space${spaces.length !== 1 ? 's' : ''}`
            }
            actions={
              <Button onClick={handleCreateSpace}>
                <Plus className="mr-2 h-4 w-4" />
                Create Space
              </Button>
            }
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          {spaces.length > 0 ? (
            <ItemGroup>
              {spaces.map((space) => (
                <SpacesListItem
                  key={space.id}
                  space={space}
                  onEdit={handleEditSpace}
                  onDelete={handleDeleteSpace}
                />
              ))}
            </ItemGroup>
          ) : (
            <InterfaceEmpty
              title="No spaces yet"
              message="Create your first space to organize conversations and collaborate with your team."
              action={
                <Button onClick={handleCreateSpace}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Space
                </Button>
              }
            />
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
