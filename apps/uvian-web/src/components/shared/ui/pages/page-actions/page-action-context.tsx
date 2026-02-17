'use client';

import * as React from 'react';

export interface ActionRegistration {
  id: string;
  label: string;
  handler: (data?: any) => void | Promise<void>;
  disabled?: boolean;
  destructive?: boolean;
  loadingLabel?: string;
}

export interface PageActionContextType {
  executeAction: (actionId: string, data?: any) => Promise<void>;
  isActionExecuting: (actionId: string) => boolean;
  getExecutingActions: () => Record<string, boolean>;
}

const PageActionContext = React.createContext<PageActionContextType | null>(
  null
);

export function usePageActionContext() {
  const context = React.useContext(PageActionContext);
  if (!context) {
    throw new Error(
      'usePageActionContext must be used within a PageActionProvider'
    );
  }
  return context;
}

export interface PageActionProviderProps {
  children: React.ReactNode;
  actions?: ActionRegistration[];
  onActionError?: (error: Error, actionId: string) => void;
  onActionSuccess?: (actionId: string) => void;
}

export function PageActionProvider({
  children,
  actions = [],
  onActionError,
  onActionSuccess,
}: PageActionProviderProps) {
  // Action execution state
  const [executingActions, setExecutingActions] = React.useState<
    Record<string, boolean>
  >({});

  const executeAction = React.useCallback(
    async (actionId: string, data: any): Promise<void> => {
      const action = actions.find((a) => a.id === actionId);
      if (!action) {
        throw new Error(`Action with id "${actionId}" not found`);
      }

      // Mark action as executing
      setExecutingActions((prev) => ({ ...prev, [actionId]: true }));

      try {
        await action.handler(data);
        onActionSuccess?.(actionId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        onActionError?.(err, actionId);
        throw err;
      } finally {
        // Mark action as not executing
        setExecutingActions((prev) => ({ ...prev, [actionId]: false }));
      }
    },
    [actions, onActionError, onActionSuccess]
  );

  const isActionExecuting = React.useCallback(
    (actionId: string): boolean => {
      return executingActions[actionId] ?? false;
    },
    [executingActions]
  );

  const getExecutingActions = React.useCallback(
    () => executingActions,
    [executingActions]
  );

  const contextValue: PageActionContextType = {
    executeAction,
    isActionExecuting,
    getExecutingActions,
  };

  return (
    <PageActionContext.Provider value={contextValue}>
      {children}
    </PageActionContext.Provider>
  );
}

export type { ActionRegistration as ActionRegistrationType };
