'use client';

import * as React from 'react';
import { useActionManager } from '../hooks/use-action-manager';
import { ActionToolbar } from '../ui/action-toolbar';
import type {
  SelectionState,
  ActionConfig,
  ActionToolbarProps,
} from '../types/action-manager';

interface WithActionManagerProps<TItem, TParams = any> {
  // Component that will receive the action manager props
  children: React.ReactNode;

  // Selection state from the component
  selectionState: SelectionState<TItem>;

  // Action configurations
  actionConfig: ActionConfig<TItem, TParams>[];

  // Optional parameters for actions
  params?: TParams;

  // UI props
  showToolbar?: boolean;
  toolbarProps?: Omit<ActionToolbarProps<TItem, TParams>, 'groupedActions'>;
}

/**
 * HOC wrapper that provides action management capabilities to any component
 * This makes it easy to add action management to existing components without refactoring
 */
export function withActionManager<TItem, TParams = any>(
  Component: React.ComponentType<any>,
  getSelectionState: () => SelectionState<TItem>,
  actionConfig: ActionConfig<TItem, TParams>[],
  getParams?: () => TParams
) {
  return function WrappedComponent(props: any) {
    const selectionState = getSelectionState();
    const params = getParams?.();

    const { groupedActions, performAction } = useActionManager(
      selectionState,
      actionConfig,
      params
    );

    return (
      <div className="relative">
        <Component {...props} />
        <ActionToolbar
          groupedActions={groupedActions}
          onAction={performAction}
          {...props.toolbarProps}
        />
      </div>
    );
  };
}

/**
 * Hook version for more flexible usage
 * Use this when you want more control over the integration
 */
export function useActionManagerIntegration<TItem, TParams = any>({
  selectionState,
  actionConfig,
  params,
  showToolbar = true,
  toolbarProps,
}: WithActionManagerProps<TItem, TParams>) {
  const { groupedActions, performAction } = useActionManager(
    selectionState,
    actionConfig,
    params
  );

  const toolbar = showToolbar ? (
    <ActionToolbar
      groupedActions={groupedActions}
      onAction={performAction}
      {...toolbarProps}
    />
  ) : null;

  return {
    groupedActions,
    performAction,
    toolbar,
  };
}

/**
 * Simple wrapper component for action manager
 * Use this when you need JSX composition over HOC pattern
 */
export function ActionManagerProvider<TItem, TParams = any>({
  children,
  selectionState,
  actionConfig,
  params,
  showToolbar = true,
  toolbarProps,
}: WithActionManagerProps<TItem, TParams>) {
  const { groupedActions, performAction } = useActionManager(
    selectionState,
    actionConfig,
    params
  );

  return (
    <div className="relative">
      {children}
      {showToolbar && (
        <ActionToolbar
          groupedActions={groupedActions}
          onAction={performAction}
          {...toolbarProps}
        />
      )}
    </div>
  );
}
