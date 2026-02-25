'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spacesQueries, spacesMutations } from '~/lib/domains/spaces/api';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { Button } from '@org/ui';
import { SpaceForm } from '../forms/space-form';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

interface SpaceEditInterfaceProps {
  spaceId: string;
}

export function SpaceEditInterface({ spaceId }: SpaceEditInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();
  const modalContext = useModalContext();

  const {
    data: space,
    isLoading,
    error,
    refetch,
  } = useQuery(spacesQueries.space(activeProfileId, spaceId));

  const { mutate: updateSpace, isPending: isUpdating } = useMutation(
    spacesMutations.updateSpace(queryClient)
  );

  const { mutate: deleteSpace, isPending: isDeleting } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  const isAdmin = space?.userRole === 'owner' || space?.userRole === 'admin';

  const handleSubmit = React.useCallback(
    async (formData: {
      name: string;
      description?: string;
      coverUrl?: string;
      avatarUrl?: string;
      isPrivate: boolean;
    }) => {
      return new Promise<void>((resolve, reject) => {
        if (!activeProfileId) {
          reject(new Error('No active profile'));
          return;
        }
        updateSpace(
          {
            authProfileId: activeProfileId,
            id: spaceId,
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
            coverUrl: formData.coverUrl?.trim() || undefined,
            avatarUrl: formData.avatarUrl?.trim() || undefined,
            isPrivate: formData.isPrivate,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['spaces'] });
              router.push(`/spaces/${spaceId}`);
              resolve();
            },
            onError: (error) => {
              console.error('Failed to update space:', error);
              reject(error);
            },
          }
        );
      });
    },
    [updateSpace, activeProfileId, spaceId, queryClient, router]
  );

  const handleCancel = React.useCallback(() => {
    router.push(`/spaces/${spaceId}`);
  }, [router, spaceId]);

  const handleDelete = React.useCallback(() => {
    if (!space) return;
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirm: () => {
        if (activeProfileId) {
          deleteSpace(
            { authProfileId: activeProfileId, spaceId: space.id },
            {
              onSuccess: () => {
                router.push('/spaces');
              },
            }
          );
        }
      },
      title: 'Delete Space',
      description: `Are you sure you want to delete "${space.name}"? This will also delete all conversations in this space.`,
    });
  }, [space, deleteSpace, modalContext, router, activeProfileId]);

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Edit Space" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading..." />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (error || !space) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Space"
            subtitle="Error"
            actions={
              <Button variant="outline" onClick={() => router.push('/spaces')}>
                Back to Spaces
              </Button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Space"
            message={error?.message || 'Space not found'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  const formInitialData = {
    name: space.name || '',
    description: space.description || '',
    coverUrl: space.coverUrl || '',
    avatarUrl: space.avatarUrl || '',
    isPrivate: space.isPrivate || false,
  };

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Space"
            subtitle="Update space settings"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <SpaceForm
            mode="edit"
            initialData={formInitialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isUpdating}
          />

          {isAdmin && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium mb-2 text-destructive">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete a space, there is no going back.
              </p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Space'}
              </Button>
            </div>
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
