'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { jobQueries } from '~/lib/domains/jobs/api/queries';
import type { JobFilters } from '~/lib/domains/jobs/types';

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
  filters?: JobFilters;
  onCreated?: () => void;
}

/**
 * Hook for managing job creation modal state and lifecycle
 */
export function useJobCreation({
  filters,
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
    // Invalidate job queries to refresh data
    queryClient.invalidateQueries({
      queryKey: jobQueries.list(filters).queryKey,
    });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });

    // Call optional callback
    onCreated?.();

    // Close modal
    closeModal();
  }, [queryClient, filters, onCreated, closeModal]);

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
