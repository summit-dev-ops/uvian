'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Settings, Users, MessageSquare, Calendar, Plus } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoadingSkeleton } from '~/components/shared/ui/interfaces/interface-loading';
import { Button, Card, CardContent, Badge, ScrollArea } from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

interface SpaceInterfaceProps {
  spaceId: string;
}

export function SpaceInterface({ spaceId }: SpaceInterfaceProps) {
  const { activeProfileId } = useUserSessionStore();
  const {
    data: space,
    isLoading,
    error,
  } = useQuery(spacesQueries.space(activeProfileId, spaceId));

  const { data: members } = useQuery(
    spacesQueries.spaceMembers(activeProfileId, spaceId)
  );

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
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <InterfaceLoadingSkeleton lines={1} className="h-8 w-48" />
            <div className="grid gap-6">
              <InterfaceLoadingSkeleton
                variant="card"
                lines={1}
                className="h-64"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InterfaceLoadingSkeleton
                  variant="card"
                  lines={1}
                  className="h-32"
                />
                <InterfaceLoadingSkeleton
                  variant="card"
                  lines={1}
                  className="h-32"
                />
                <InterfaceLoadingSkeleton
                  variant="card"
                  lines={1}
                  className="h-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Space header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{space.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {space.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {new Date(space.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {space.isPrivate && (
                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/spaces/${spaceId}/edit`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {space.memberCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                </div>
                <Link
                  href={`/spaces/${spaceId}/members`}
                  className="text-sm text-primary hover:underline"
                >
                  Manage members
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {space.conversationCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Conversations
                    </div>
                  </div>
                </div>
                <Link
                  href="/chats"
                  className="text-sm text-primary hover:underline"
                >
                  View conversations
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">👑</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {space.userRole || 'member'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Your role
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent conversations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Conversations</h2>
              <Link
                href="/chats"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </div>

          {/* Recent members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Members</h2>
              <Link
                href={`/spaces/${spaceId}/members`}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {members?.length === 0 ? (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">No members yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Invite your team to start collaborating.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/spaces/${spaceId}/members`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {members?.slice(0, 5).map((member) => (
                  <Card key={member.profileId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.profile?.displayName?.[0] || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.profile?.displayName || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Joined{' '}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            member.role?.name === 'admin'
                              ? 'default'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full mr-2 ${
                              member.role?.name === 'admin'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {member.role?.name || 'member'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
