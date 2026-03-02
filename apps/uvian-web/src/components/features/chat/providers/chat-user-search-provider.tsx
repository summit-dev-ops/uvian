'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useDeferredValue,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api';
import { userQueries } from '~/lib/domains/user/api';
import type { ProfileUI } from '~/lib/domains/profile/types';

interface ChatUserSearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  results: ProfileUI[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  selected: ProfileUI[];
  toggleSelected: (item: ProfileUI) => void;
  isSelected: (item: ProfileUI) => boolean;
  clearSelection: () => void;
  setSelected: (items: ProfileUI[]) => void;
}

const ChatUserSearchContext = createContext<ChatUserSearchContextValue | null>(
  null
);

export function useChatUserSearch() {
  const context = useContext(ChatUserSearchContext);
  if (!context) {
    throw new Error(
      'useChatUserSearch must be used within ChatUserSearchProvider'
    );
  }
  return context;
}

interface ChatUserSearchProviderProps {
  conversationId: string;
  children: React.ReactNode;
  initialSelected?: ProfileUI[];
}

export function ChatUserSearchProvider({
  conversationId,
  children,
  initialSelected = [],
}: ChatUserSearchProviderProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProfileUI[]>(initialSelected);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDeferredValue(query);

  const { data: members, isLoading: isLoadingMembers } = useQuery(
    chatQueries.conversationMembers(conversationId)
  );

  const userIds = members?.map((m) => m.userId) ?? [];

  const { data: profilesData, isLoading: isLoadingProfiles } = useQuery({
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

  const toggleSelected = useCallback((item: ProfileUI) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) {
        return prev.filter((s) => s.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const isSelected = useCallback(
    (item: ProfileUI) => {
      return selected.some((s) => s.id === item.id);
    },
    [selected]
  );

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  const contextValue = useMemo<ChatUserSearchContextValue>(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      results: filteredProfiles,
      isLoading: isLoadingMembers || isLoadingProfiles,
      error: null,
      page,
      totalPages: 1,
      hasMore: false,
      goToPage: (p) => setPage(Math.max(1, p)),
      nextPage: () => setPage((p) => p + 1),
      prevPage: () => setPage((p) => Math.max(1, p - 1)),
      setPage: (p) => setPage(p),
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
      setSelected,
    }),
    [
      query,
      debouncedQuery,
      filteredProfiles,
      isLoadingMembers,
      isLoadingProfiles,
      page,
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
    ]
  );

  return (
    <ChatUserSearchContext.Provider value={contextValue}>
      {children}
    </ChatUserSearchContext.Provider>
  );
}
