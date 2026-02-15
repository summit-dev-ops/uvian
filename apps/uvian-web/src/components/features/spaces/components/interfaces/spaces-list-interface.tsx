'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Settings, Users, MessageSquare } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoadingSkeleton } from '~/components/shared/ui/interfaces/interface-loading';
import { Button, Card, CardContent } from '@org/ui';
import type { SpaceUI } from '~/lib/domains/spaces/types';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

// Import new layout components
import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
} from '~/components/shared/ui/interfaces/interface-layout';

export function SpacesListInterface() {
  const { activeProfileId } = useUserSessionStore();
  // Fetch spaces
  const {
    data: spaces,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaces(activeProfileId));

  // Fetch space stats
  const { data: stats } = useQuery(spacesQueries.spaceStats(activeProfileId));

  if (error) {
    return (
      <InterfaceError
        variant="card"
        title="Failed to Load Spaces"
        message={
          error.message ||
          'There was an error loading your spaces. Please try again.'
        }
        showRetry={true}
        showHome={true}
        onRetry={() => window.location.reload()}
        className="flex h-screen items-center justify-center"
      />
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer variant="default" size="full">
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Spaces"
            subtitle="Organize your conversations and collaborate with your team"
          />
        </InterfaceHeader>
        <InterfaceContent>
          <InterfaceSection variant="card">
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {stats.totalSpaces}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Spaces
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {stats.ownedSpaces}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Owned Spaces
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {stats.memberSpaces}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Member Spaces
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {stats.totalConversations}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Conversations
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </InterfaceSection>

          <InterfaceSection title="Your Spaces">
            {/* Spaces list */}
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <InterfaceLoadingSkeleton
                    key={i}
                    variant="card"
                    lines={4}
                    className="h-32"
                  />
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
                  <p className="text-sm text-muted-foreground">
                    Create your first space using the actions menu above
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {spaces?.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            )}
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
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
                    className={`inline-block h-2 w-2 rounded-full ${
                      space.userRole === 'admin'
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
                // TODO: Handle settings click - needs implementation
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
