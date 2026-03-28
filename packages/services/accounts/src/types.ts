import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface Account {
  id: string;
  name: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: {
    name: string;
    permissions?: string[];
  };
  created_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string;
}

export interface CreateAccountPayload {
  name?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateAccountPayload {
  name?: string;
  settings?: Record<string, unknown>;
}

export interface AccountsScopedService {
  getAccounts(userId: string): Promise<Account[]>;
  getAccount(accountId: string, userId: string): Promise<Account>;
  createAccount(
    userId: string,
    payload: CreateAccountPayload
  ): Promise<Account>;
  updateAccount(
    accountId: string,
    userId: string,
    payload: UpdateAccountPayload
  ): Promise<Account>;
  getAccountMembers(
    accountId: string,
    userId: string
  ): Promise<AccountMember[]>;
  getAccountMember(
    accountId: string,
    userId: string,
    memberUserId: string
  ): Promise<AccountMember | null>;
  addAccountMember(
    accountId: string,
    userId: string,
    newMemberUserId: string,
    role: { name: string; permissions?: string[] }
  ): Promise<AccountMember>;
  updateAccountMember(
    accountId: string,
    userId: string,
    targetUserId: string,
    role: { name: string; permissions?: string[] }
  ): Promise<AccountMember>;
  removeAccountMember(
    accountId: string,
    userId: string,
    targetUserId: string
  ): Promise<void>;
}

export interface AccountsAdminService {
  checkAccountMembership(userIdA: string, userIdB: string): Promise<boolean>;
  getAccountById(accountId: string): Promise<Account | null>;
}

export interface CreateAccountsServiceConfig {}
