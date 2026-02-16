'use client';

import * as React from 'react';
import { MODAL_REGISTRY } from './modal-registry';
import { ModalRegistration, ModalState } from './types';

// Initial modal configuration
export interface InitialModal {
  modalId: string;
  shouldBeOpen: boolean;
  initialProps?: Record<string, any>;
}

/**
 * Modal Context Interface
 * Provides clean, focused modal lifecycle management
 */
export interface ModalContextType {
  // State access
  isModalOpen: (modalId: string) => boolean;
  getModalProps: (modalId: string) => Record<string, any>;
  getAllModalStates: () => Record<string, ModalState>;

  // Modal lifecycle management
  openModal: (modalId: string, props?: Record<string, any>) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;

  // Utilities
  toggleModal: (modalId: string) => void;
  setModalProps: (modalId: string, props: Record<string, any>) => void;
}

const ModalContext = React.createContext<ModalContextType | null>(null);

export function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}

export interface ModalProviderProps {
  children: React.ReactNode;
  modals?: Record<string, ModalRegistration>;
  initiate?: InitialModal[];
}

/**
 * ModalProvider
 * Pure modal lifecycle management - separate concern from actions
 */
export function ModalProvider({
  children,
  modals = MODAL_REGISTRY,
  initiate = [],
}: ModalProviderProps) {
  // Initialize modal state from modals registry and initiate prop
  const [modalState, setModalState] = React.useState<
    Record<string, ModalState>
  >(() => {
    const initialState: Record<string, ModalState> = {};

    // Initialize with modals from registry
    Object.keys(modals).forEach((modalId) => {
      initialState[modalId] = {
        isOpen: false,
        props: modals[modalId].defaultProps || {},
      };
    });

    // Apply initiate prop overrides
    initiate.forEach(({ modalId, shouldBeOpen, initialProps }) => {
      if (initialState[modalId]) {
        initialState[modalId] = {
          isOpen: shouldBeOpen,
          props: { ...initialState[modalId].props, ...initialProps },
        };
      }
    });

    return initialState;
  });

  // Modal lifecycle methods
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

  const toggleModal = React.useCallback((modalId: string) => {
    setModalState((prev) => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        isOpen: !prev[modalId]?.isOpen,
      },
    }));
  }, []);

  const setModalProps = React.useCallback(
    (modalId: string, props: Record<string, any>) => {
      setModalState((prev) => ({
        ...prev,
        [modalId]: {
          ...prev[modalId],
          props: { ...prev[modalId]?.props, ...props },
        },
      }));
    },
    []
  );

  // State access methods
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

  const getAllModalStates = React.useCallback(() => modalState, [modalState]);

  const contextValue: ModalContextType = {
    // State access
    isModalOpen,
    getModalProps,
    getAllModalStates,

    // Modal lifecycle
    openModal,
    closeModal,
    closeAllModals,

    // Utilities
    toggleModal,
    setModalProps,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}
