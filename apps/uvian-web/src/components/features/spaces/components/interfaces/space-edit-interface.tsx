'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import { SpaceForm } from '../forms/space-form';

interface SpaceEditInterfaceProps {
  spaceId: string;
}

export function SpaceEditInterface({ spaceId }: SpaceEditInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  // Fetch space data
  const {
    data: space,
    isLoading,
    error,
  } = useQuery(spacesQueries.space(activeProfileId, spaceId));

  // Mutations
  const { mutate: updateSpace, isPending: isUpdating } = useMutation(
    spacesMutations.updateSpace(queryClient)
  );

  const { mutate: deleteSpace, isPending: isDeleting } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  // Check if current user is admin
  const isAdmin = space?.userRole === 'owner' || space?.userRole === 'admin';

  const handleSave = (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    if (activeProfileId) {
      updateSpace({
        authProfileId: activeProfileId,
        id: spaceId,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        isPrivate: data.isPrivate,
      });
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this space? This action cannot be undone.'
      )
    ) {
      if (activeProfileId) {
        deleteSpace({ authProfileId: activeProfileId, spaceId });
      }

      router.push('/spaces');
    }
  };

  const handleBack = () => {
    router.push(`/spaces/${spaceId}`);
  };

  const spaceData = space || {
    name: '',
    description: '',
    isPrivate: false,
  };

  const handleSubmit = async (formData: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    await handleSave(formData);
  };

  const handleCancel = () => {
    handleBack();
  };
  // Early return for error state
  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Space"
            subtitle="Error loading space"
            actions={
              <Button variant="outline" size="sm" onClick={handleBack}>
                Back to Space
              </Button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Failed to Load Space"
            message={
              error.message ||
              'There was an error loading this space. Please try again.'
            }
            showRetry={true}
            showHome={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for loading state
  if (isLoading || !space) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Space"
            subtitle="Loading space editor..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading space editor..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceHeader spacing="compact">
        <InterfaceHeaderContent
          title="Edit Space"
          subtitle="Update your space settings and preferences"
        />
      </InterfaceHeader>
      <InterfaceContent spacing="default">
        <SpaceForm
          mode="edit"
          initialData={spaceData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          disabled={isUpdating}
        />
        {/* Danger zone */}
        {isAdmin && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Once you delete a space, there is no going back. This will
                permanently delete the space and all associated conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Space'}
              </Button>
            </CardContent>
          </Card>
        )}
      </InterfaceContent>
    </InterfaceLayout>
  );
}
