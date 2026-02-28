'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/lib/supabase/client';

export function useCurrentUser() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const client = createClient();
      const { data } = await client.auth.getSession();
      return data.session;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return {
    userId: session?.user?.id,
    isLoading,
  };
}
