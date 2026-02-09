'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Settings, Users, MessageSquare } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { Button, Card, CardContent, ScrollArea, Skeleton } from '@org/ui';
import type { SpaceUI } from '~/lib/domains/spaces/types';

export function SpacesView() {
  const queryClient = useQueryClient();

  // Fetch spaces
  const { data: spaces, isLoading, error } = useQuery(spacesQueries.spaces());

  // Fetch space stats
  const { data: stats } = useQuery(spacesQueries.spaceStats());

  // Create space mutation
  const { mutate: createSpace, isPending: isCreating } = useMutation(
    spacesMutations.createSpace(queryClient),
  );

  const handleCreateSpace = () => {
    const name = prompt('Enter space name:')?.trim();
    const description =
      prompt('Enter space description (optional):')?.trim() || '';

    if (!name) return;

    createSpace({
      name,
      description: description || undefined,
      is_private: false,
    });
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">
              Error loading spaces
            </h2>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className='flex-1'>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Spaces</h1>
              <p className="text-muted-foreground mt-1">
                Organize your conversations and collaborate with your team
              </p>
            </div>
            <Button onClick={handleCreateSpace} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Space'}
            </Button>
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">{stats.total_spaces}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Spaces
                  </div>
                </CardContent>
              </Card>
              <Card className="p-4">
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">{stats.owned_spaces}</div>
                  <div className="text-sm text-muted-foreground">
                    Owned Spaces
                  </div>
                </CardContent>
              </Card>
              <Card className="p-4">
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    {stats.member_spaces}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Member Spaces
                  </div>
                </CardContent>
              </Card>
              <Card className="p-4">
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">
                    {stats.total_conversations}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Conversations
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Spaces list */}
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32">
                  <CardContent className="h-full flex items-center justify-center">
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : spaces?.length === 0 ? (
            <Card className="py-24">
              <CardContent className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">No spaces yet</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create your first space to organize conversations and
                    collaborate with your team.
                  </p>
                </div>
                <Button onClick={handleCreateSpace} disabled={isCreating}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Create Space'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {spaces?.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </div>
      </div></ScrollArea>
  );
}

interface SpaceCardProps {
  space: SpaceUI;
}

function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Card className="group hover:bg-accent/50 transition-all duration-200">
      <Link href={`/spaces/${space.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🏢</span>
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {space.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {space.description || 'No description provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{space.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{space.conversationCount || 0} conversations</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${space.userRole === 'admin'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      }`}
                  />
                  <span className="capitalize">
                    {space.userRole || 'member'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle settings click
              }}
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Created {new Date(space.createdAt).toLocaleDateString()}
            {space.isPrivate && (
              <span className="ml-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                Private
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
