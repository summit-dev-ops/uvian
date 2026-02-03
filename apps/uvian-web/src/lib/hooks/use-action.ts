'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useStoreApi } from '~/components/providers/store/store-provider';
import type { BaseAction } from '~/lib/actions';

/**
 * Hook to execute a BaseAction with the necessary context.
 */
export function useAction<P, O>(action: BaseAction<P, O>) {
  const queryClient = useQueryClient();
  const store = useStoreApi();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const perform = async (payload: P): Promise<O | undefined> => {
    const ctx = {
      queryClient,
      store,
      router,
    };

    if (!action.canPerform(ctx, payload)) {
      console.warn(
        `Action ${action.id} cannot be performed with current context/payload`
      );
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const result = await action.perform(ctx, payload);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    perform,
    isPending,
    error,
  };
}
