'use client';

import * as React from 'react';
import { usePageActionContext } from './page-action-context';
import { MODAL_REGISTRY } from './modal-registry';

/**
 * PageModals component
 * Renders all active modals from the PageActionContext
 * This component ensures modals are rendered at the page level, not within dropdown components
 * which solves the shadcn portal issue
 */
export function PageModals() {
  const context = usePageActionContext();
  const modalState = context.getModalState();

  const activeModals = React.useMemo(() => {
    return Object.entries(modalState)
      .filter(([modalId, state]) => state.isOpen && MODAL_REGISTRY[modalId])
      .map(([modalId, state]) => {
        const registration = MODAL_REGISTRY[modalId];
        const ModalComponent = registration.Component;

        return {
          modalId,
          ModalComponent,
          props: {
            ...registration.defaultProps,
            ...state.props,
            open: true,
            onOpenChange: (open: boolean) => {
              if (open) {
                context.openModal(modalId, state.props);
              } else {
                context.closeModal(modalId);
              }
            },
          },
        };
      });
  }, [modalState, context]);

  if (activeModals.length === 0) {
    return null;
  }

  return (
    <>
      {activeModals.map(({ modalId, ModalComponent, props }) => (
        <ModalComponent key={modalId} {...props} />
      ))}
    </>
  );
}

/**
 * PageModalsContainer component
 * A convenience component that wraps PageModals with provider check
 */
export function PageModalsContainer() {
  return <PageModals />;
}
