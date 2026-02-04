/**
 * User Feature Components
 *
 * Reusable React components for user profile management.
 */

export { ProfileView, CompactProfileView } from './components/ProfileView';
export { ProfileEditor, InlineProfileEditor } from './components/ProfileEditor';
export {
  ProfileAvatar,
  ProfileAvatarWithFallback,
  SimpleProfileAvatar,
} from './components/ProfileAvatar';

/**
 * User Feature Hooks
 *
 * React hooks for user profile data and state management.
 */

export { useProfile } from './hooks/use-profile';
export { useProfileEdit } from './hooks/use-profile-edit';

/**
 * User Domain Types (Re-exported for convenience)
 *
 * TypeScript types for user profiles and settings.
 */

export type {
  ProfileAPI,
  ProfileUI,
  SettingsAPI,
  SettingsUI,
  ProfileDraft,
  SettingsDraft,
} from '~/lib/domains/user/types';

/**
 * User Domain API (Re-exported for convenience)
 *
 * Query keys, queries, and mutations for the user domain.
 */

export { userKeys, userQueries, userMutations } from '~/lib/domains/user/api';

/**
 * User Domain Actions (Re-exported for convenience)
 *
 * Business logic actions for user profile management.
 */

export { userActions } from '~/lib/domains/user/actions';

/**
 * User Domain Store (Re-exported for convenience)
 *
 * Zustand store integration for user state management.
 */

export { createUserSlice, type UserSlice } from '~/lib/domains/user/store';
