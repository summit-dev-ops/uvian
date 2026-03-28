import { ServiceClients, UserScopedService, UserSettings } from './types';

export function createUserScopedService(
  clients: ServiceClients
): UserScopedService {
  return {
    async getSettings(userId: string): Promise<UserSettings | undefined> {
      const { data, error } = await clients.userClient
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch settings: ${error.message}`);
      }

      if (!data) {
        return undefined;
      }

      return {
        userId: data.user_id,
        settings: data.settings,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },

    async createSettings(
      userId: string,
      settings: Record<string, unknown>
    ): Promise<UserSettings> {
      const { data, error } = await clients.adminClient
        .from('settings')
        .insert({
          user_id: userId,
          settings: settings,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create settings: ${error.message}`);
      }

      return {
        userId: data.user_id,
        settings: data.settings,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },

    async updateSettings(
      userId: string,
      settings: Record<string, unknown>
    ): Promise<UserSettings> {
      const existing = await this.getSettings(userId);

      if (!existing) {
        return this.createSettings(userId, settings);
      }

      const mergedSettings = {
        ...existing.settings,
        ...settings,
      };

      const { data, error } = await clients.adminClient
        .from('settings')
        .update({
          settings: mergedSettings,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update settings: ${error.message}`);
      }

      return {
        userId: data.user_id,
        settings: data.settings,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },

    async deleteSettings(userId: string): Promise<void> {
      const { error } = await clients.adminClient
        .from('settings')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete settings: ${error.message}`);
      }
    },
  };
}
