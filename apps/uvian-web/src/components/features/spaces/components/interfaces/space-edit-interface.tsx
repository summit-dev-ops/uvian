'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoadingSkeleton } from '~/components/shared/ui/interfaces/interface-loading';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  ScrollArea,
} from '@org/ui';
import { SpaceEditor } from '../space-editor';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

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
  const isAdmin = space?.userRole === 'admin';

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

  if (error) {
    return (
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
        className="flex h-screen items-center justify-center"
      />
    );
  }

  if (isLoading || !space) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <InterfaceLoadingSkeleton lines={1} className="h-8 w-8" />
          <div className="space-y-2">
            <InterfaceLoadingSkeleton lines={1} className="h-8 w-48" />
            <InterfaceLoadingSkeleton lines={1} className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <InterfaceLoadingSkeleton lines={1} className="h-4 w-32" />
              <InterfaceLoadingSkeleton lines={1} className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <InterfaceLoadingSkeleton lines={1} className="h-4 w-24" />
              <InterfaceLoadingSkeleton lines={1} className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <InterfaceLoadingSkeleton lines={1} className="h-4 w-40" />
              <InterfaceLoadingSkeleton lines={1} className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Edit Space</h1>
          <p className="text-muted-foreground">
            Update your space settings and preferences
          </p>
        </div>
      </div>

      <SpaceEditor
        className="p-2"
        data={{
          name: space?.name || '',
          description: space?.description || '',
          isPrivate: space?.isPrivate || false,
        }}
        onSave={handleSave}
        onCancel={handleBack}
        isLoading={isUpdating}
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
    </ScrollArea>
  );
}
