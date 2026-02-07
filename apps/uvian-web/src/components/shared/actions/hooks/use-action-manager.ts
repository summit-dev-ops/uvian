'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useStoreApi } from '~/components/providers/store/store-provider';
import type { BaseActionContext } from '~/lib/actions';
import type {
  ActionConfig,
  SelectionState,
  ActionManagerResult,
} from '../types/action-manager';

/**
 * Hook for managing state-driven actions based on selection state
 * @param selectionState - Current selection state with selected items and metadata
 * @param actionConfig - Array of action configurations
 * @param params - Optional parameters passed to all actions
 * @returns Object with available actions, grouped actions, and performAction function
 */
export function useActionManager<TItem, TParams = any>(
  selectionState: SelectionState<TItem>,
  actionConfig: ActionConfig<TItem, TParams>[],
  params?: TParams
): ActionManagerResult<TItem, TParams> {
  // Inject the same context as the existing useAction hook
  const queryClient = useQueryClient();
  const store = useStoreApi();
  const router = useRouter();

  const context: BaseActionContext = { queryClient, store, router };

  // Evaluate which actions are available based on selection state
  const availableActions = useMemo(() => {
    return actionConfig
      .filter((action) => {
        const {
          minSelection,
          maxSelection,
          requireSelection,
          selectionValidator,
        } = action.visibility;

        // Require selection validation
        if (requireSelection && !selectionState.hasSelection) return false;

        // Selection count validation
        if (
          minSelection !== undefined &&
          selectionState.selectionCount < minSelection
        )
          return false;
        if (
          maxSelection !== undefined &&
          selectionState.selectionCount > maxSelection
        )
          return false;

        // Custom selection validator
        if (selectionValidator && !selectionValidator(selectionState))
          return false;

        return true;
      })
      .map((action) => ({
        ...action,
        perform: async () => {
          await action.perform(
            selectionState,
            params ?? ({} as TParams),
            context
          );
        },
      }));
  }, [selectionState, actionConfig, params, context]);

  // Group actions by their group property
  const groupedActions = useMemo(() => {
    return availableActions.reduce((acc, action) => {
      if (!acc[action.group]) {
        acc[action.group] = [];
      }
      acc[action.group].push(action);
      return acc;
    }, {} as Record<string, Array<ActionConfig<TItem, TParams>>>);
  }, [availableActions]);

  // Function to perform a specific action by ID
  const performAction = useMemo(() => {
    return async (actionId: string) => {
      const action = availableActions.find((a) => a.id === actionId);
      if (action) {
        await action.perform();
      }
    };
  }, [availableActions]);

  return {
    availableActions,
    groupedActions,
    performAction,
  };
}
