'use client';

import * as React from 'react';
import { ContactSupportDialog } from '../../dialogs/contact-support-dialog';
import { ContactFormData } from '~/components/features/support/components/forms/contact-form';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';

export interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function ContactSupportModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: ContactSupportModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await executeAction(onConfirmActionId, {
        name: data.name?.trim() || undefined,
        email: data.email.trim(),
        category: data.category,
        priority: data.priority,
        subject: data.subject.trim(),
        message: data.message.trim(),
      });
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    }
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (!isLoading) {
      try {
        if (onCancelActionId) {
          await executeAction(onCancelActionId, {});
        }
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
  };

  return (
    <ContactSupportDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
