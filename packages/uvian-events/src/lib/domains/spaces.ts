import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const SpaceEvents = {
  SPACE_CREATED: `${prefix}.space.space_created`,
  SPACE_UPDATED: `${prefix}.space.space_updated`,
  SPACE_DELETED: `${prefix}.space.space_deleted`,
  SPACE_MEMBER_JOINED: `${prefix}.space.member_joined`,
  SPACE_MEMBER_LEFT: `${prefix}.space.member_left`,
  SPACE_MEMBER_ROLE_CHANGED: `${prefix}.space.member_role_changed`,
} as const;

export type SpaceEventType = (typeof SpaceEvents)[keyof typeof SpaceEvents];

export interface SpaceCreatedData {
  spaceId: string;
  name: string;
  createdBy: string;
  memberIds: string[];
}

export interface SpaceUpdatedData {
  spaceId: string;
  updatedBy: string;
  name?: string;
}

export interface SpaceDeletedData {
  spaceId: string;
  deletedBy: string;
}

export interface SpaceMemberJoinedData {
  spaceId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  invitedBy?: string;
}

export interface SpaceMemberLeftData {
  spaceId: string;
  userId: string;
  removedBy?: string;
}

export interface SpaceMemberRoleChangedData {
  spaceId: string;
  userId: string;
  oldRole: 'member' | 'moderator' | 'admin';
  newRole: 'member' | 'moderator' | 'admin';
  changedBy: string;
}

export type SpaceEventData =
  | SpaceCreatedData
  | SpaceUpdatedData
  | SpaceDeletedData
  | SpaceMemberJoinedData
  | SpaceMemberLeftData
  | SpaceMemberRoleChangedData;
