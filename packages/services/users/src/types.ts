import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

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

export interface SearchUsersOptions {
  query?: string;
  includeAgents?: boolean;
  limit?: number;
}

export interface UserScopedService {
  getSettings(userId: string): Promise<UserSettings | undefined>;
  createSettings(
    userId: string,
    settings: Record<string, unknown>
  ): Promise<UserSettings>;
  updateSettings(
    userId: string,
    settings: Record<string, unknown>
  ): Promise<UserSettings>;
  deleteSettings(userId: string): Promise<void>;
}

export interface UserAdminService {
  getUserById(userId: string): Promise<User | null>;
  searchUsers(options?: SearchUsersOptions): Promise<User[]>;
}

export interface CreateUserServiceConfig {
  settingsSchema?: string;
}
