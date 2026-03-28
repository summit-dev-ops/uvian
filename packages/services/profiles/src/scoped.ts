import {
  ServiceClients,
  ProfileScopedService,
  Profile,
  CreateOrUpdateProfileInput,
} from './types';

export function createProfileScopedService(
  clients: ServiceClients
): ProfileScopedService {
  return {
    async getProfile(profileId: string): Promise<Profile> {
      const { data, error } = await clients.userClient
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error || !data) {
        throw new Error('Profile not found');
      }

      return transformFromDatabase(data);
    },

    async getProfileByUserId(userId: string): Promise<Profile> {
      const { data, error } = await clients.userClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new Error('Profile not found');
      }

      return transformFromDatabase(data);
    },

    async createOrUpdateProfile(
      userId: string,
      data: CreateOrUpdateProfileInput
    ): Promise<Profile> {
      const updateData: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (data.displayName !== undefined)
        updateData.display_name = data.displayName;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.bio !== undefined) updateData.bio = data.bio;

      const { data: profile, error } = await clients.adminClient
        .from('profiles')
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return transformFromDatabase(profile);
    },

    async updateProfile(
      userId: string,
      profileId: string,
      data: CreateOrUpdateProfileInput
    ): Promise<Profile> {
      const { data: existing } = await clients.userClient
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

      if (!existing || existing.user_id !== userId) {
        throw new Error("Cannot update another user's profile");
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.displayName !== undefined)
        updateData.display_name = data.displayName;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.bio !== undefined) updateData.bio = data.bio;

      const { data: profile, error } = await clients.adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return transformFromDatabase(profile);
    },

    async deleteProfile(
      userId: string,
      profileId: string
    ): Promise<{ success: boolean }> {
      const { data: existing } = await clients.userClient
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

      if (!existing || existing.user_id !== userId) {
        throw new Error("Cannot delete another user's profile");
      }

      const { error } = await clients.adminClient
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },
  };
}

function transformFromDatabase(record: Record<string, unknown>): Profile {
  return {
    id: record.id as string,
    userId: record.user_id as string,
    displayName: (record.display_name as string) || '',
    avatarUrl: record.avatar_url as string | undefined,
    bio: record.bio as string | null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
  };
}
