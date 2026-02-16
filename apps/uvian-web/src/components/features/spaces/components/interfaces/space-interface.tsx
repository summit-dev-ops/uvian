'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Settings,
  Users,
  MessageSquare,
  ChevronRight,
  Shield,
  Calendar,
  Lock,
  Globe,
} from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceBanner,
  InterfaceContent,
  InterfaceSection,
  InterfaceFooter,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Separator,
} from '@org/ui';
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
    refetch,
  } = useQuery(spacesQueries.space(activeProfileId, spaceId));

  // Early return for error state
  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceError
            title="Failed to Load Space"
            message="There was an error loading this space."
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  // Early return for loading state
  if (isLoading || !space) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceLoading message="Loading space..." />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      {/* 1. Root Card Container - Compact Size, Card Variant, No Spacing */}
      <InterfaceContainer>
        {/* 2. Header Section (Banner + Actions) */}
        <InterfaceBanner
          height="sm"
          gradientFrom="#6B46C1" // Space Purple
          gradientTo="#6B46C1"
          gradientOpacity={1} // Solid color look
          className="relative"
        />

        {/* 3. Content Body (Negative Margin for Avatar) */}
        <InterfaceContent spacing="compact" className="pt-0">
          {/* Avatar/Icon Overlap Wrapper */}
          <div className="relative mb-3">
            <div className="-mt-12 ml-1">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 border-[6px] border-card bg-card">
                  <AvatarImage src={undefined} alt={space.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-3xl">
                    {space.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Status/Privacy Indicator */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      space.isPrivate ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  >
                    {space.isPrivate ? (
                      <Lock className="h-2.5 w-2.5 text-white" />
                    ) : (
                      <Globe className="h-2.5 w-2.5 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Block */}
          <div className="px-1 mb-6">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              {space.name}
              {space.userRole === 'admin' && (
                <Shield className="h-4 w-4 text-purple-500" />
              )}
            </h1>

            <div className="flex flex-col gap-1 mt-1">
              {space.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {space.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {space.isPrivate ? 'PRIVATE SPACE' : 'PUBLIC SPACE'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info Blocks Group */}
          <div className="space-y-3">
            {/* Info Box 1: Creation Date */}
            <InterfaceSection className="p-3 space-y-1 bg-muted/30 border-none">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Established
                </p>
              </div>
              <p className="text-sm font-medium pl-5">
                {new Date(space.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </InterfaceSection>

            {/* Info Box 2: Interactive Lists */}
            <InterfaceSection className="p-0 overflow-hidden bg-muted/30 border-none">
              {/* Row: Members */}
              <Link
                href={`/spaces/${spaceId}/members`}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-background rounded-md shadow-sm">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Members</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {space.memberCount || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </Link>

              <Separator className="bg-background/50" />

              {/* Row: Conversations */}
              <Link
                href={`/spaces/${spaceId}/conversations`}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-background rounded-md shadow-sm">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Conversations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {space.conversationCount || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </Link>
            </InterfaceSection>
          </div>
        </InterfaceContent>

        {/* 4. Footer */}
        <InterfaceFooter justify="center" spacing="compact" className="pt-2">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-foreground no-underline text-xs"
          >
            View All Activity
          </Button>
        </InterfaceFooter>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
