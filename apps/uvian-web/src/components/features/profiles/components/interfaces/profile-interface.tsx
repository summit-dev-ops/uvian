'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, MoreHorizontal, UserCheck } from 'lucide-react';
import { profileQueries } from '~/lib/domains/profile/api';

import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceBanner,
  InterfaceContent,
  InterfaceSection,
  InterfaceFooter,
} from '~/components/shared/ui/interfaces/interface-layout';

import { Avatar, AvatarImage, AvatarFallback } from '@org/ui';
import { Badge, Button, Separator } from '@org/ui';

interface ProfileInterfaceProps {
  profileId: string;
  className?: string;
}

export function ProfileInterface({
  profileId,
  className,
}: ProfileInterfaceProps) {
  const { data: profile, isLoading } = useQuery(
    profileQueries.profile(profileId)
  );

  if (isLoading || !profile) return null; // Simplified for structural focus

  return (
    <InterfaceLayout>
      <InterfaceContainer className={className}>
        {/* 2. Header Section (Banner + Actions) */}
        <InterfaceBanner
          height="sm"
          gradientFrom="#5865F2"
          gradientTo="#5865F2"
          className="relative"
        ></InterfaceBanner>

        {/* 3. Content Body (Negative Margin for Avatar) */}
        <InterfaceContent spacing="compact" className="pt-0">
          {/* Avatar Overlap Wrapper */}
          <div className="relative mb-3">
            <div className="-mt-12 ml-1">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 border-[6px] border-card">
                  <AvatarImage
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                  />
                  <AvatarFallback className="bg-[#5865F2] text-white text-xl">
                    {profile.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Status Indicator */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border-4 border-muted-foreground/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Identity Block */}
          <div className="px-1 mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {profile.displayName}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">
                {profile.displayName.toLowerCase()}.
              </span>
              <Badge
                variant="secondary"
                className="h-4 px-1 bg-[#23a559] hover:bg-[#23a559] text-white border-none"
              >
                #
              </Badge>
            </div>
          </div>

          {/* Info Blocks (Using Section with card variant) */}
          <div className="space-y-3">
            {/* Member Since Block */}
            <InterfaceSection
              variant="card"
              className="p-3 space-y-1 bg-muted/30 border-none"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Member Since
              </p>
              <p className="text-sm">
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </InterfaceSection>

            {/* Mutuals List Group */}
            <InterfaceSection
              variant="card"
              className="p-0 overflow-hidden bg-muted/30 border-none"
            >
              <button className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors group text-left">
                <span className="text-sm font-medium">Mutual Servers — 3</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>

              <Separator className="bg-background/50" />

              <button className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors group text-left">
                <span className="text-sm font-medium">Mutual Friends — 1</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
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
            View Full Profile
          </Button>
        </InterfaceFooter>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
