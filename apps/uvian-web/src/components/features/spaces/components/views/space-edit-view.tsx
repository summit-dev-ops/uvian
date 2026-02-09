'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Textarea,
  Checkbox,
  Skeleton,
} from '@org/ui';

interface SpaceEditViewProps {
  spaceId: string;
}

export function SpaceEditView({ spaceId }: SpaceEditViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch space data
  const {
    data: space,
    isLoading,
    error,
  } = useQuery(spacesQueries.space(spaceId));

  // Initialize form with space data
  React.useEffect(() => {
    if (space) {
      setName(space.name || '');
      setDescription(space.description || '');
      setIsPrivate(space.isPrivate || false);
    }
  }, [space]);

  // Mutations
  const { mutate: updateSpace, isPending: isUpdating } = useMutation(
    spacesMutations.updateSpace(queryClient),
  );

  const { mutate: deleteSpace, isPending: isDeleting } = useMutation(
    spacesMutations.deleteSpace(queryClient),
  );

  // Check if current user is admin
  const isAdmin = space?.userRole === 'admin';

  const handleSave = () => {
    if (!name.trim()) {
      alert('Space name is required');
      return;
    }

    updateSpace({
      id: spaceId,
      name: name.trim(),
      description: description.trim() || undefined,
      is_private: isPrivate,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this space? This action cannot be undone.',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Edit Space</h1>
          <p className="text-muted-foreground">
            Update your space settings and preferences
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Space Settings</CardTitle>
            <CardDescription>
              Update the basic information about your space
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Space Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter space name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your space (optional)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-3">
                <Checkbox
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(!!checked)}
                />
                <span>Make this space private</span>
              </Label>
              <p className="text-xs text-muted-foreground ml-6">
                Private spaces are only visible to invited members
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isUpdating || !name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={handleBack} disabled={isUpdating}>
            Cancel
          </Button>
        </div>

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

        {/* Current space info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Space Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(space.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members:</span>
              <span>{space.memberCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversations:</span>
              <span>{space.conversationCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your role:</span>
              <span className="capitalize">{space.userRole || 'member'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
