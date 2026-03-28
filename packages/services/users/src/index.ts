import { SupabaseClient } from '@supabase/supabase-js';

export interface UserSettings {
  userId: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
  isAgent?: boolean;
  name?: string;
}

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface SearchUsersOptions {
  query?: string;
  includeAgents?: boolean;
  limit?: number;
}

export interface CreateUserServiceConfig {
  settingsSchema?: string;
}

export interface UserService {
  getSettings(
    clients: ServiceClients,
    userId: string
  ): Promise<UserSettings | undefined>;
  createSettings(
    clients: ServiceClients,
    userId: string,
    settings: Record<string, unknown>
  ): Promise<UserSettings>;
  updateSettings(
    clients: ServiceClients,
    userId: string,
    settings: Record<string, unknown>
  ): Promise<UserSettings>;
  deleteSettings(clients: ServiceClients, userId: string): Promise<void>;
  getUserById(clients: ServiceClients, userId: string): Promise<User | null>;
  searchUsers(
    clients: ServiceClients,
    options?: SearchUsersOptions
  ): Promise<User[]>;
}

export function createUserService(
  _config: CreateUserServiceConfig
): UserService {
  return {
    async getSettings(
      clients: ServiceClients,
      userId: string
    ): Promise<UserSettings | undefined> {
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
      clients: ServiceClients,
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
      clients: ServiceClients,
      userId: string,
      settings: Record<string, unknown>
    ): Promise<UserSettings> {
      const existing = await this.getSettings(clients, userId);

      if (!existing) {
        return this.createSettings(clients, userId, settings);
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

    async deleteSettings(
      clients: ServiceClients,
      userId: string
    ): Promise<void> {
      const { error } = await clients.adminClient
        .from('settings')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete settings: ${error.message}`);
      }
    },

    async getUserById(
      clients: ServiceClients,
      userId: string
    ): Promise<User | null> {
      const { data, error } = await clients.adminClient
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        userMetadata: data.raw_user_meta_data,
        isAgent: data.raw_user_meta_data?.is_agent === true,
        name: data.raw_user_meta_data?.name as string | undefined,
      };
    },

    async searchUsers(
      clients: ServiceClients,
      options?: SearchUsersOptions
    ): Promise<User[]> {
      const limit = options?.limit || 10;

      let query = clients.adminClient
        .from('users')
        .select('id, email, raw_user_meta_data');

      if (options?.includeAgents) {
        query = query.eq('raw_user_meta_data->>is_agent', 'true');
      }

      if (options?.query) {
        query = query.ilike('raw_user_meta_data->>name', `%${options.query}%`);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        throw new Error(`Failed to search users: ${error.message}`);
      }

      return (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        userMetadata: user.raw_user_meta_data,
        isAgent: user.raw_user_meta_data?.is_agent === true,
        name: user.raw_user_meta_data?.name as string | undefined,
      }));
    },
  };
}
