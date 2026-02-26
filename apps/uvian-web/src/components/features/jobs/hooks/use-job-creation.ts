'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseJobCreationReturn {
  // Modal state
  isOpen: boolean;

  // Modal handlers
  openModal: () => void;
  closeModal: () => void;

  // Success callback
  onSuccess: () => void;
}

interface UseJobCreationProps {
  onCreated?: () => void;
}

/**
 * Hook for managing job creation modal state and lifecycle
 */
export function useJobCreation({
  onCreated,
}: UseJobCreationProps): UseJobCreationReturn {
  const queryClient = useQueryClient();

  // Modal state
  const [isOpen, setIsOpen] = React.useState(false);

  // Open modal
  const openModal = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close modal
  const closeModal = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  // Success callback - refresh job data and call optional callback
  const handleSuccess = React.useCallback(() => {
    // Invalidate all job queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['jobs'] });

    // Call optional callback
    onCreated?.();

    // Close modal
    closeModal();
  }, [queryClient, onCreated, closeModal]);

  return {
    // Modal state
    isOpen,

    // Modal handlers
    openModal,
    closeModal,

    // Success callback
    onSuccess: handleSuccess,
  };
}
