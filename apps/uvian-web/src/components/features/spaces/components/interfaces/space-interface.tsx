'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Calendar,
  Lock,
  Globe,
  Pencil,
  Trash2,
  MoreHorizontal,
  Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spacesQueries, spacesMutations } from '~/lib/domains/spaces/api';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceBanner,
  InterfaceBannerContent,
} from '~/components/shared/ui/interfaces';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { Avatar, AvatarImage, AvatarFallback } from '@org/ui';
import { Button } from '@org/ui';
import { Badge } from '@org/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@org/ui';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
import { PostList } from '~/components/features/posts/components/post-list';

interface SpaceInterfaceProps {
  spaceId: string;
}

export function SpaceInterface({ spaceId }: SpaceInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useModalContext();

  const {
    data: space,
    isLoading,
    error,
    refetch,
  } = useQuery(spacesQueries.space(spaceId));

  const { mutate: deleteSpace } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  const handleEdit = React.useCallback(() => {
    router.push(`/spaces/${spaceId}/edit`);
  }, [router, spaceId]);

  const handleDelete = React.useCallback(() => {
    if (!space) return;
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirm: () => {
        deleteSpace(
          { spaceId: space.id },
          {
            onSuccess: () => {
              router.push('/spaces');
            },
          }
        );
      },
      title: 'Delete Space',
      description: `Are you sure you want to delete "${space.name}"? This will also delete all conversations in this space.`,
    });
  }, [space, deleteSpace, modalContext, router]);

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Space" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading space..." />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (error || !space) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Space" subtitle="Error" />
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

  const createdDate = new Date(space.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isAdmin = space.userRole === 'owner' || space.userRole === 'admin';

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceBanner imageUrl={space.coverUrl} height="lg">
          <InterfaceBannerContent className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  {space.avatarUrl ? (
                    <AvatarImage src={space.avatarUrl} alt={space.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                    {space.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-white drop-shadow-md">
                      {space.name}
                    </h1>
                    {isAdmin && (
                      <Shield className="h-5 w-5 text-white drop-shadow-md" />
                    )}
                    {space.isPrivate ? (
                      <Lock className="h-4 w-4 text-white/80" />
                    ) : (
                      <Globe className="h-4 w-4 text-white/80" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={space.isPrivate ? 'secondary' : 'outline'}
                      className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      {space.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/10 text-white hover:bg-white/20 border-white/30"
                    >
                      {space.userRole || 'member'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      suppressHydrationWarning
                      className="text-white hover:bg-white/20"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </InterfaceBannerContent>
        </InterfaceBanner>

        <InterfaceContent spacing="default">
          <div className="flex flex-col gap-6">
            {space.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {space.description}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href={`/spaces/${spaceId}/members`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>{space.memberCount || 0} members</span>
              </Link>
              <Link
                href={`/spaces/${spaceId}/conversations`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{space.conversationCount || 0} conversations</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {createdDate}</span>
            </div>
          </div>
        </InterfaceContent>

        <InterfaceContent spacing="default">
          <PostList spaceId={spaceId} />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
