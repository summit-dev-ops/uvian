import type { Account, AccountMember } from '@org/services-accounts';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface CreateAccountCommandInput {
  userId: string;
  name?: string;
  settings?: Record<string, unknown>;
}

export interface CreateAccountCommandOutput {
  account: Account;
}

export interface UpdateAccountCommandInput {
  userId: string;
  accountId: string;
  name?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateAccountCommandOutput {
  account: Account;
}

export interface UpdateAccountMemberCommandInput {
  userId: string;
  accountId: string;
  targetUserId: string;
  role: { name: string; permissions?: string[] };
}

export interface UpdateAccountMemberCommandOutput {
  member: AccountMember;
}

export interface RemoveAccountMemberCommandInput {
  userId: string;
  accountId: string;
  targetUserId: string;
}

export interface RemoveAccountMemberCommandOutput {
  success: boolean;
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
}
