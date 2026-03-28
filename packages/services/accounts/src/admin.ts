import { ServiceClients, AccountsAdminService, Account } from './types';

export function createAccountsAdminService(
  clients: ServiceClients
): AccountsAdminService {
  return {
    async checkAccountMembership(
      userIdA: string,
      userIdB: string
    ): Promise<boolean> {
      const { data: userAAccounts } = await clients.adminClient
        .from('account_members')
        .select('account_id')
        .eq('user_id', userIdA);

      if (!userAAccounts || userAAccounts.length === 0) {
        return false;
      }

      const { data: userBAccounts } = await clients.adminClient
        .from('account_members')
        .select('account_id')
        .eq('user_id', userIdB);

      if (!userBAccounts || userBAccounts.length === 0) {
        return false;
      }

      const accountIdsA = new Set(userAAccounts.map((a) => a.account_id));
      return userBAccounts.some((b) => accountIdsA.has(b.account_id));
    },

    async getAccountById(accountId: string): Promise<Account | null> {
      const { data, error } = await clients.adminClient
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch account: ${error.message}`);
      }

      return data || null;
    },
  };
}
