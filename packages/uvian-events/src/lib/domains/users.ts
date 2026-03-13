import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const UserEvents = {
  PROFILE_CREATED: `${prefix}.user.profile_created`,
  PROFILE_UPDATED: `${prefix}.user.profile_updated`,
  PROFILE_DELETED: `${prefix}.user.profile_deleted`,
} as const;

export type UserEventType = (typeof UserEvents)[keyof typeof UserEvents];

export interface ProfileCreatedData {
  profileId: string;
  userId: string;
}

export interface ProfileUpdatedData {
  profileId: string;
  updatedBy: string;
  name?: string;
  avatarUrl?: string;
}

export interface ProfileDeletedData {
  profileId: string;
  deletedBy: string;
}

export type UserEventData =
  | ProfileCreatedData
  | ProfileUpdatedData
  | ProfileDeletedData;
