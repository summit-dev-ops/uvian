import type { ComponentType } from 'react';
import { ConfirmModal } from '../../modals/confirm-modal';
import { ExportModal } from '../../modals/export-modal';
import { CreateConversationModal } from '../../modals/create-conversation-modal';

// Modal Registration Interface
export interface ModalRegistration {
  id: string;
  Component: ComponentType<any>;
  defaultProps?: Record<string, any>;
}

// Modal Registry - Maps modal IDs to their components and default props
export const MODAL_REGISTRY: Record<string, ModalRegistration> = {
  'confirm-delete': {
    id: 'confirm-delete',
    Component: ConfirmModal,
    defaultProps: {
      variant: 'destructive',
      title: 'Delete Item',
      description: 'This action cannot be undone.',
    },
  },
  'confirm-leave': {
    id: 'confirm-leave',
    Component: ConfirmModal,
    defaultProps: {
      variant: 'default',
      title: 'Leave Conversation',
      description: 'Are you sure you want to leave this conversation?',
    },
  },
  'export-chat': {
    id: 'export-chat',
    Component: ExportModal,
  },
  'create-conversation': {
    id: 'create-conversation',
    Component: CreateConversationModal,
  },
};

// Modal IDs as constants for type safety
export const MODAL_IDS = {
  CONFIRM_DELETE: 'confirm-delete',
  CONFIRM_LEAVE: 'confirm-leave',
  EXPORT_CHAT: 'export-chat',
  CREATE_CONVERSATION: 'create-conversation',
} as const;

// Modal state interface
export interface ModalState {
  isOpen: boolean;
  props: Record<string, any>;
}
