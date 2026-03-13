import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const AccountEvents = {
  ACCOUNT_CREATED: `${prefix}.account.account_created`,
  ACCOUNT_UPDATED: `${prefix}.account.account_updated`,
  ACCOUNT_MEMBER_ADDED: `${prefix}.account.member_added`,
  ACCOUNT_MEMBER_REMOVED: `${prefix}.account.member_removed`,
  ACCOUNT_MEMBER_ROLE_CHANGED: `${prefix}.account.member_role_changed`,
} as const;

export type AccountEventType =
  (typeof AccountEvents)[keyof typeof AccountEvents];

export interface AccountCreatedData {
  accountId: string;
  name: string;
  createdBy: string;
}

export interface AccountUpdatedData {
  accountId: string;
  updatedBy: string;
  name?: string;
}

export interface AccountMemberAddedData {
  accountId: string;
  userId: string;
  role: 'member' | 'admin';
  addedBy: string;
}

export interface AccountMemberRemovedData {
  accountId: string;
  userId: string;
  removedBy: string;
}

export interface AccountMemberRoleChangedData {
  accountId: string;
  userId: string;
  oldRole: 'member' | 'admin';
  newRole: 'member' | 'admin';
  changedBy: string;
}

export type AccountEventData =
  | AccountCreatedData
  | AccountUpdatedData
  | AccountMemberAddedData
  | AccountMemberRemovedData
  | AccountMemberRoleChangedData;
