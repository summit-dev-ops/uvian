/**
 * User Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 * Unified approach: profiles and settings work for any profileId.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { userKeys } from './keys';
import { SettingsUI } from '../types';


// ============================================================================
// Query Options
// ============================================================================

export const userQueries = {
  /**
   * Fetch current user's settings.
   * Note: Settings are private to the authenticated user.
   */
  settings: () =>
    queryOptions({
      queryKey: userKeys.settings(),
      queryFn: async () => {
        const { data } = await apiClient.get<SettingsUI>(
          `/api/profiles/me/settings`
        );
        return data
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
    
};
