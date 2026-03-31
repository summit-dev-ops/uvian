import {
  ServiceClients,
  AccountsScopedService,
  CreateAccountPayload,
  UpdateAccountPayload,
  Account,
  AccountMember,
} from './types';

export function createAccountsScopedService(
  clients: ServiceClients
): AccountsScopedService {
  async function checkAccountAccess(
    accountId: string,
    userId: string,
    allowedRoles?: string[]
  ): Promise<boolean> {
    const { data: membership } = await clients.adminClient
      .from('account_members')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return false;
    }

    if (!allowedRoles) {
      return true;
    }

    return allowedRoles.includes(membership.role?.name || '');
  }

  return {
    async getAccounts(userId: string): Promise<Account[]> {
      const { data: memberAccounts, error: memberError } =
        await clients.userClient
          .from('account_members')
          .select('account_id')
          .eq('user_id', userId);

      if (memberError) {
        throw new Error(
          `Failed to fetch account memberships: ${memberError.message}`
        );
      }

      const accountIds = memberAccounts?.map((m) => m.account_id) || [];

      if (accountIds.length === 0) {
        return [];
      }

      const { data, error } = await clients.userClient
        .from('accounts')
        .select('*')
        .in('id', accountIds);

      if (error) {
        throw new Error(`Failed to fetch accounts: ${error.message}`);
      }

      return data || [];
    },

    async getAccount(accountId: string, userId: string): Promise<Account> {
      const { data: membership, error: membershipError } =
        await clients.adminClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .eq('user_id', userId)
          .single();

      if (membershipError || !membership) {
        throw new Error('Account not found or access denied');
      }

      const { data, error } = await clients.userClient
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error || !data) {
        throw new Error('Account not found');
      }

      return data;
    },

    async createAccount(
      userId: string,
      payload: CreateAccountPayload
    ): Promise<Account> {
      const { data: account, error } = await clients.adminClient
        .from('accounts')
        .insert({
          name: payload.name || null,
          settings: payload.settings || {},
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create account: ${error.message}`);
      }

      const { error: memberError } = await clients.adminClient
        .from('account_members')
        .insert({
          account_id: account.id,
          user_id: userId,
          role: { name: 'owner', permissions: ['admin', 'member', 'billing'] },
        });

      if (memberError) {
        await clients.adminClient
          .from('accounts')
          .delete()
          .eq('id', account.id);
        throw new Error(`Failed to add account member: ${memberError.message}`);
      }

      return account;
    },

    async updateAccount(
      accountId: string,
      userId: string,
      payload: UpdateAccountPayload
    ): Promise<Account> {
      const hasAccess = await checkAccountAccess(accountId, userId, [
        'owner',
        'admin',
      ]);
      if (!hasAccess) {
        throw new Error('Access denied: insufficient permissions');
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) {
        updateData.name = payload.name;
      }
      if (payload.settings !== undefined) {
        updateData.settings = payload.settings;
      }

      const { data, error } = await clients.adminClient
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update account: ${error.message}`);
      }

      return data;
    },

    async getAccountMembers(
      accountId: string,
      userId: string
    ): Promise<AccountMember[]> {
      const hasAccess = await checkAccountAccess(accountId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const { data, error } = await clients.adminClient
        .from('account_members')
        .select('*')
        .eq('account_id', accountId);

      if (error) {
        throw new Error(`Failed to fetch account members: ${error.message}`);
      }

      const members = data || [];
      const userIds = members.map((m) => m.user_id);

      const { data: profiles } = await clients.adminClient
        .schema('core_hub')
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const { data: users } = await clients.adminClient
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);

      return members.map((member) => ({
        ...member,
        display_name: profileMap.get(member.user_id)?.display_name || null,
        avatar_url: profileMap.get(member.user_id)?.avatar_url || null,
        email: userMap.get(member.user_id)?.email || '',
      }));
    },

    async getAccountMember(
      accountId: string,
      userId: string,
      memberUserId: string
    ): Promise<AccountMember | null> {
      const hasAccess = await checkAccountAccess(accountId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const { data, error } = await clients.adminClient
        .from('account_members')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', memberUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch account member: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const { data: profile } = await clients.adminClient
        .schema('core_hub')
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', memberUserId)
        .single();

      const { data: user } = await clients.adminClient
        .from('users')
        .select('id, email')
        .eq('id', memberUserId)
        .single();

      return {
        ...data,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        email: user?.email || '',
      };
    },

    async addAccountMember(
      accountId: string,
      userId: string,
      newMemberUserId: string,
      role: { name: string; permissions?: string[] }
    ): Promise<AccountMember> {
      const hasAccess = await checkAccountAccess(accountId, userId, [
        'owner',
        'admin',
      ]);
      if (!hasAccess) {
        throw new Error('Access denied: insufficient permissions');
      }

      const { data: existingMember } = await clients.adminClient
        .from('account_members')
        .select('id')
        .eq('account_id', accountId)
        .eq('user_id', newMemberUserId)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this account');
      }

      const { data, error } = await clients.adminClient
        .from('account_members')
        .insert({
          account_id: accountId,
          user_id: newMemberUserId,
          role: role || { name: 'member', permissions: [] },
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add account member: ${error.message}`);
      }

      return {
        ...data,
        display_name: null,
        avatar_url: null,
        email: '',
      };
    },

    async updateAccountMember(
      accountId: string,
      userId: string,
      targetUserId: string,
      role: { name: string; permissions?: string[] }
    ): Promise<AccountMember> {
      const hasAccess = await checkAccountAccess(accountId, userId, [
        'owner',
        'admin',
      ]);
      if (!hasAccess) {
        throw new Error('Access denied: insufficient permissions');
      }

      const { data: targetMember } = await clients.adminClient
        .from('account_members')
        .select('user_id, role')
        .eq('account_id', accountId)
        .eq('user_id', targetUserId)
        .single();

      if (!targetMember) {
        throw new Error('Member not found');
      }

      if (targetMember.role?.name === 'owner') {
        throw new Error('Cannot modify owner role');
      }

      const { data, error } = await clients.adminClient
        .from('account_members')
        .update({ role })
        .eq('account_id', accountId)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update account member: ${error.message}`);
      }

      return data;
    },

    async removeAccountMember(
      accountId: string,
      userId: string,
      targetUserId: string
    ): Promise<void> {
      const hasAccess = await checkAccountAccess(accountId, userId, [
        'owner',
        'admin',
      ]);
      if (!hasAccess) {
        throw new Error('Access denied: insufficient permissions');
      }

      const { data: targetMember } = await clients.adminClient
        .from('account_members')
        .select('user_id, role')
        .eq('account_id', accountId)
        .eq('user_id', targetUserId)
        .single();

      if (!targetMember) {
        throw new Error('Member not found');
      }

      if (targetMember.role?.name === 'owner') {
        throw new Error('Cannot remove account owner');
      }

      if (targetUserId === userId) {
        throw new Error('Cannot remove yourself from the account');
      }

      const { error } = await clients.adminClient
        .from('account_members')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', targetUserId);

      if (error) {
        throw new Error(`Failed to remove account member: ${error.message}`);
      }
    },
  };
}
