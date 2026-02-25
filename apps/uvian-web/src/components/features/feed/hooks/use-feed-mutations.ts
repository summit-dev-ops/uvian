'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedMutations } from '~/lib/domains/feed/api/mutations';

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation(feedMutations.markAsRead(queryClient));
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation(feedMutations.markAllAsRead(queryClient));
};
