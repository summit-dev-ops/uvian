import { SupabaseClient } from '@supabase/supabase-js';
import { UserSettings } from '../types/users.types';

export class UserService {
  // Utility methods
  async getCurrentUserFromRequest(request: any): Promise<string> {
    if (!request.user || !request.user.id) {
      throw new Error('User not authenticated');
    }
    return request.user.id;
  }
  // Settings CRUD operations
  async getSettings(
    supabaseClient: SupabaseClient,
    userId: string
  ): Promise<UserSettings | undefined> {
    const { data, error } = await supabaseClient
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

    // Transform database format to interface format
    return {
      userId: data.user_id,
      settings: data.settings,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createSettings(
    supabaseClient: SupabaseClient,
    userId: string,
    settings: Record<string, any> = {}
  ): Promise<UserSettings> {
    const { data: settingsRecord, error } = await supabaseClient
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

    // Transform database format to interface format
    return {
      userId: settingsRecord.user_id,
      settings: settingsRecord.settings,
      createdAt: settingsRecord.created_at,
      updatedAt: settingsRecord.updated_at,
    };
  }

  async updateSettings(
    supabaseClient: SupabaseClient,
    userId: string,
    settings: Record<string, any>
  ): Promise<UserSettings> {
    const existingSettings = await this.getSettings(supabaseClient, userId);

    if (!existingSettings) {
      return this.createSettings(supabaseClient, userId, settings);
    }

    const mergedSettings = {
      ...existingSettings.settings,
      ...settings,
    };

    const { data: settingsRecord, error } = await supabaseClient
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

    // Transform database format to interface format
    return {
      userId: settingsRecord.user_id,
      settings: settingsRecord.settings,
      createdAt: settingsRecord.created_at,
      updatedAt: settingsRecord.updated_at,
    };
  }

  async deleteSettings(
    supabaseClient: SupabaseClient,
    userId: string
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('settings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete settings: ${error.message}`);
    }
  }
}

export const userService = new UserService();
