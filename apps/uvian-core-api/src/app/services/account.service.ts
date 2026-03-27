import { SupabaseClient } from '@supabase/supabase-js';

interface Account {
  id: string;
  name: string | null;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: { name: string; permissions: unknown[] };
  created_at: string;
}

export class AccountService {
  async getAccount(
    userClient: SupabaseClient,
    accountId: string
  ): Promise<Account | null> {
    const { data, error } = await userClient
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return data || null;
  }

  async listAccountMembers(
    userClient: SupabaseClient,
    accountId: string
  ): Promise<AccountMember[]> {
    const { data, error } = await userClient
      .from('account_members')
      .select('*')
      .eq('account_id', accountId);

    if (error) {
      throw new Error(`Failed to fetch account members: ${error.message}`);
    }

    return data || [];
  }

  async getAccountMember(
    userClient: SupabaseClient,
    accountId: string,
    memberUserId: string
  ): Promise<AccountMember | null> {
    const { data, error } = await userClient
      .from('account_members')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', memberUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch account member: ${error.message}`);
    }

    return data || null;
  }

  async getAccountsForUser(
    userClient: SupabaseClient,
    userId: string
  ): Promise<Array<{ account_members: AccountMember; account: Account }>> {
    const { data, error } = await userClient
      .from('account_members')
      .select('*, account:accounts(*)')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data || [];
  }
}

export const accountService = new AccountService();
