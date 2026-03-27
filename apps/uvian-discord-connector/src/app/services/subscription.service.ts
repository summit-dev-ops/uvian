import { adminSupabase } from '../clients/supabase.client';

interface Subscription {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  is_active: boolean;
  created_at: string;
}

interface AgentUser {
  id: string;
  raw_user_meta_data: Record<string, unknown>;
}

export class SubscriptionService {
  async getUserByDiscordId(discordUserId: string): Promise<string | null> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .select('user_id')
      .eq('provider', 'discord')
      .eq('provider_user_id', discordUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch identity: ${error.message}`);
    }

    return data?.user_id || null;
  }

  async getAgentByName(agentName: string): Promise<AgentUser | null> {
    const { data, error } = await adminSupabase
      .from('auth.users')
      .select('id, raw_user_meta_data')
      .eq('raw_user_meta_data->>is_agent', 'true')
      .ilike('raw_user_meta_data->>name', agentName)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    return data || null;
  }

  async getSubscriptionByUserAndSource(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription | null> {
    const { data, error } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data || null;
  }

  async activateAgentForSource(
    agentUserId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription> {
    const existing = await this.getSubscriptionByUserAndSource(
      agentUserId,
      resourceType,
      resourceId
    );

    if (existing) {
      const { data, error } = await adminSupabase
        .from('subscriptions')
        .update({ is_active: true })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to activate subscription: ${error.message}`);
      }

      return data;
    }

    const { data, error } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: agentUserId,
        resource_type: resourceType,
        resource_id: resourceId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }

  async deactivateForSource(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const { error } = await adminSupabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Failed to deactivate: ${error.message}`);
    }
  }
}

export const subscriptionService = new SubscriptionService();
