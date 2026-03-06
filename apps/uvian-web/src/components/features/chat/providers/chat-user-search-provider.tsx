'use client';

import React, { useMemo, useState, useDeferredValue, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  SearchContext,
  SearchContextValue,
} from '~/components/shared/ui/search/contexts';
import { SearchResultItemData } from '~/components/shared/ui/search/types';
import { userQueries } from '~/lib/domains/user/api';
import { chatQueries } from '~/lib/domains/chat/api';
import { ProfileUI } from '~/lib/domains/profile/types';

interface ChatUserSearchProviderProps {
  conversationId: string;
  children: React.ReactNode;
}

export function ChatUserSearchProvider({
  conversationId,
  children,
}: ChatUserSearchProviderProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const debouncedQuery = useDeferredValue(query);

  const {
    data: members,
    isLoading: isLoadingMembers,
    error: errorMembers,
  } = useQuery(chatQueries.conversationMembers(conversationId));

  const userIds = members?.map((m) => m.userId) ?? [];

  const {
    data: profilesData,
    isLoading: isLoadingProfiles,
    error: errorProfiles,
  } = useQuery({
    ...userQueries.profilesByUserIds(userIds),
    enabled: userIds.length > 0,
  });

  const allProfiles = useMemo(() => {
    if (!profilesData) return [];
    return Object.values(profilesData).filter(Boolean) as ProfileUI[];
  }, [profilesData]);

  const filteredProfiles = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return allProfiles;
    }
    const q = debouncedQuery.toLowerCase();
    return allProfiles.filter((profile) =>
      profile.displayName?.toLowerCase().includes(q)
    );
  }, [allProfiles, debouncedQuery]);

  const results = useMemo<SearchResultItemData[]>(() => {
    return filteredProfiles.map<SearchResultItemData>((profile) => ({
      url: '',
      key: profile.userId,
      type: 'user',
      content: {
        avatarUrl: profile.avatarUrl ?? null,
        displayName: profile.displayName,
        userType: profile.type,
        profileId: profile.id,
      },
    }));
  }, [filteredProfiles]);

  const search = useCallback(
    async (q: string): Promise<SearchResultItemData[]> => {
      const profiles = !q.trim()
        ? allProfiles
        : allProfiles.filter((profile) =>
            profile.displayName?.toLowerCase().includes(q.toLowerCase())
          );

      return profiles.map((profile) => ({
        url: '',
        key: profile.userId,
        type: 'user',
        content: {
          avatarUrl: profile.avatarUrl ?? null,
          displayName: profile.displayName,
          userType: profile.type,
          profileId: profile.id,
        },
      }));
    },
    [allProfiles]
  );

  const contextValue = useMemo<SearchContextValue>(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      results,
      isLoading: isLoadingMembers || isLoadingProfiles,
      error: errorMembers ?? errorProfiles,
      page,
      totalPages: 1,
      hasMore: false,
      goToPage: (p) => setPage(Math.max(1, p)),
      nextPage: () => setPage((p) => p + 1),
      prevPage: () => setPage((p) => Math.max(1, p - 1)),
      setPage: (p) => setPage(p),
      search,
    }),
    [
      query,
      debouncedQuery,
      results,
      isLoadingProfiles,
      isLoadingMembers,
      errorMembers,
      errorProfiles,
      page,
      search,
    ]
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}
