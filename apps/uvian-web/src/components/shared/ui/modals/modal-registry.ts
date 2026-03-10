import {
  CreateProfileModal,
  ExportModal,
  ConfirmModal,
  InviteUserAsMemberModal,
  CreateSpaceModal,
  CreateConversationModal,
  CreateJobModal,
  ContactSupportModal,
  CreatePostModal,
  CreateNoteModal,
  MessageSelectionModal,
  ImageCarouselModal,
} from './modals';
import { ModalRegistration } from './types';

// Modal IDs as constants for type safety
export const MODAL_IDS = {
  CONFIRM_ACTION: 'confirm-action',
  CONFIRM_DELETE: 'confirm-delete',
  CONFIRM_LEAVE: 'confirm-leave',
  EXPORT_CHAT: 'export-chat',
  CREATE_CONVERSATION: 'create-conversation',
  CREATE_PROFILE: 'create-profile',
  CREATE_SPACE: 'create-space',
  INVITE_MEMBERS: 'invite-members',
  INVITE_PROFILES: 'invite-profiles',
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
  CREATE_JOB: 'create-job',
  CONTACT_SUPPORT: 'contact-support',
  CREATE_POST: 'create-post',
  DELETE_POST: 'delete-post',
  CREATE_NOTE: 'create-note',
  MESSAGE_SELECTION: 'message-selection',
  IMAGE_CAROUSEL: 'image-carousel',
} as const;

// Modal Registry - Maps modal IDs to their components and default props
export const MODAL_REGISTRY: Record<string, ModalRegistration> = {
  'create-job': {
    id: 'create-job',
    Component: CreateJobModal,
  },
  'confirm-action': {
    id: 'confirm-action',
    Component: ConfirmModal,
  },
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
  'create-profile': {
    id: 'create-profile',
    Component: CreateProfileModal,
  },
  'create-space': {
    id: 'create-space',
    Component: CreateSpaceModal,
  },
  'invite-user-as-member': {
    id: 'invite-user-as-member',
    Component: InviteUserAsMemberModal,
    defaultProps: {
      defaultRole: 'member',
    },
  },
  'contact-support': {
    id: 'contact-support',
    Component: ContactSupportModal,
  },
  'create-post': {
    id: 'create-post',
    Component: CreatePostModal,
  },
  'create-note': {
    id: 'create-note',
    Component: CreateNoteModal,
  },
  'message-selection': {
    id: 'message-selection',
    Component: MessageSelectionModal,
  },
  'image-carousel': {
    id: 'image-carousel',
    Component: ImageCarouselModal,
  },
};
