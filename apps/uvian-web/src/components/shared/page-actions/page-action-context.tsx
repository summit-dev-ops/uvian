'use client';

import * as React from 'react';
import type { ModalState } from './modal-registry';
import { MODAL_REGISTRY, MODAL_IDS } from './modal-registry';

export interface ActionRegistration {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  handler: () => void | Promise<void>;
  disabled?: boolean;
  destructive?: boolean;
  loadingLabel?: string;
}

export interface PageActionContextType {
  // Modal management
  openModal: (modalId: string, props?: Record<string, any>) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;
  getModalProps: (modalId: string) => Record<string, any>;

  // Action management
  executeAction: (actionId: string) => Promise<void>;
  isActionExecuting: (actionId: string) => boolean;

  // State access
  getModalState: () => Record<string, ModalState>;
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
  initialModalState?: Record<string, ModalState>;
  onActionError?: (error: Error, actionId: string) => void;
  onActionSuccess?: (actionId: string) => void;
}

export function PageActionProvider({
  children,
  actions = [],
  initialModalState = {},
  onActionError,
  onActionSuccess,
}: PageActionProviderProps) {
  // Modal state management
  const [modalState, setModalState] =
    React.useState<Record<string, ModalState>>(initialModalState);

  // Action execution state
  const [executingActions, setExecutingActions] = React.useState<
    Record<string, boolean>
  >({});

  // Initialize modal state for registered modals
  React.useEffect(() => {
    const initialState: Record<string, ModalState> = {};

    Object.keys(MODAL_REGISTRY).forEach((modalId) => {
      initialState[modalId] = {
        isOpen: false,
        props: {},
      };
    });

    setModalState((prevState) => ({ ...initialState, ...prevState }));
  }, []);

  const openModal = React.useCallback(
    (modalId: string, props: Record<string, any> = {}) => {
      setModalState((prev) => ({
        ...prev,
        [modalId]: {
          isOpen: true,
          props: { ...prev[modalId]?.props, ...props },
        },
      }));
    },
    []
  );

  const closeModal = React.useCallback((modalId: string) => {
    setModalState((prev) => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        isOpen: false,
      },
    }));
  }, []);

  const closeAllModals = React.useCallback(() => {
    setModalState((prev) =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key] = { ...prev[key], isOpen: false };
        return acc;
      }, {} as Record<string, ModalState>)
    );
  }, []);

  const isModalOpen = React.useCallback(
    (modalId: string): boolean => {
      return modalState[modalId]?.isOpen ?? false;
    },
    [modalState]
  );

  const getModalProps = React.useCallback(
    (modalId: string): Record<string, any> => {
      return modalState[modalId]?.props ?? {};
    },
    [modalState]
  );

  const executeAction = React.useCallback(
    async (actionId: string): Promise<void> => {
      const action = actions.find((a) => a.id === actionId);
      if (!action) {
        throw new Error(`Action with id "${actionId}" not found`);
      }

      // Mark action as executing
      setExecutingActions((prev) => ({ ...prev, [actionId]: true }));

      try {
        await action.handler();
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

  const getModalState = React.useCallback(() => modalState, [modalState]);
  const getExecutingActions = React.useCallback(
    () => executingActions,
    [executingActions]
  );

  const contextValue: PageActionContextType = {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalProps,
    executeAction,
    isActionExecuting,
    getModalState,
    getExecutingActions,
  };

  return (
    <PageActionContext.Provider value={contextValue}>
      {children}
    </PageActionContext.Provider>
  );
}

// Export constants for easy access
export { MODAL_IDS, MODAL_REGISTRY };
export type { ModalState };
export type { ActionRegistration as ActionRegistrationType };
