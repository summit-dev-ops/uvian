'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  ScrollArea,
} from '@org/ui';
import { SpaceEditor } from '../space-editor';

interface SpaceEditInterfaceProps {
  spaceId: string;
}

export function SpaceEditInterface({ spaceId }: SpaceEditInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch space data
  const {
    data: space,
    isLoading,
    error,
  } = useQuery(spacesQueries.space(spaceId));

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
    updateSpace({
      id: spaceId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      is_private: data.isPrivate,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this space? This action cannot be undone.'
      )
    ) {
      deleteSpace({ spaceId });
      router.push('/spaces');
    }
  };

  const handleBack = () => {
    router.push(`/spaces/${spaceId}`);
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">
              Error loading space
            </h2>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !space) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-32" />
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
        className='p-2'
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
