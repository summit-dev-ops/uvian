'use client';

import React from 'react';
import { SpaceForm } from './forms/space-form';

// Simplified, optimized prop interface
interface SpaceEditorProps {
  // Data identification
  spaceId?: string;

  // Callbacks
  onSave: (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  disabled?: boolean;
  showCancel?: boolean;
  className?: string;

  // For backward compatibility, accept direct data
  data?: {
    name: string;
    description?: string;
    isPrivate: boolean;
  };
}

/**
 * SpaceEditor - Data-aware wrapper that uses SpaceForm
 * Handles data fetching and business logic while delegating form rendering to SpaceForm
 */
export const SpaceEditor: React.FC<SpaceEditorProps> = ({
  spaceId,
  data: directData,
  onSave,
  onCancel,
  isLoading = false,
  disabled = false,
  showCancel = true,
  className,
}) => {
  const spaceData = directData || {
    name: '',
    description: '',
    isPrivate: false,
  };

  const handleSubmit = async (formData: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    await onSave(formData);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`flex flex-1 flex-col ${className || ''}`}>
      <SpaceForm
        mode="edit"
        initialData={spaceData}
        onSubmit={handleSubmit}
        onCancel={showCancel ? handleCancel : undefined}
        isLoading={isLoading}
        disabled={disabled}
        showCancel={false}
        autoFocus={false}
      />
    </div>
  );
};
