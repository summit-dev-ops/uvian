import { SupabaseClient } from '@supabase/supabase-js';
import { ResourceScope } from '../types/job.types';

/**
 * Resource Scopes Service - Internal Service for Job Context Management
 *
 * Resource scopes are automatically managed interface layers that provide
 * context for job execution. They are created by database triggers when
 * new spaces/conversations are created, and jobs are assigned to the
 * appropriate scope based on their spaceId or conversationId.
 */
export class ResourceScopesService {
  /**
   * Gets or creates a resource scope for a space
   * This is called automatically when creating jobs in a space
   */
  async getOrCreateSpaceResourceScope(
    supabaseClient: SupabaseClient,
    spaceId: string,
    userId?: string
  ): Promise<ResourceScope> {
    // Validate access to space if userId provided
    if (userId) {
      await this.validateSpaceAccess(supabaseClient, spaceId, userId);
    }

    // Try to get existing resource scope for this space
    const existing = await this.getResourceScopeBySpace(
      supabaseClient,
      spaceId
    );

    if (existing) {
      return existing;
    }

    // If no scope exists, create one (this shouldn't happen due to triggers,
    // but provides a fallback)
    return this.createSpaceResourceScope(supabaseClient, spaceId);
  }

  /**
   * Gets or creates a resource scope for a conversation
   * This is called automatically when creating jobs in a conversation
   */
  async getOrCreateConversationResourceScope(
    supabaseClient: SupabaseClient,
    conversationId: string,
    userId?: string
  ): Promise<ResourceScope> {
    // Validate access to conversation if userId provided
    if (userId) {
      await this.validateConversationAccess(
        supabaseClient,
        conversationId,
        userId
      );
    }

    // Try to get existing resource scope for this conversation
    const existing = await this.getResourceScopeByConversation(
      supabaseClient,
      conversationId
    );

    if (existing) {
      return existing;
    }

    // If no scope exists, create one (this shouldn't happen due to triggers,
    // but provides a fallback)
    return this.createConversationResourceScope(supabaseClient, conversationId);
  }

  /**
   * Gets a resource scope by space ID
   */
  async getResourceScopeBySpace(
    supabaseClient: SupabaseClient,
    spaceId: string
  ): Promise<ResourceScope | null> {
    const { data: resourceScope, error } = await supabaseClient
      .from('resource_scopes')
      .select('*')
      .eq('space_id', spaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(
        `Failed to fetch resource scope for space: ${error.message}`
      );
    }

    return this.transformFromDatabase(resourceScope);
  }

  /**
   * Gets a resource scope by conversation ID
   */
  async getResourceScopeByConversation(
    supabaseClient: SupabaseClient,
    conversationId: string
  ): Promise<ResourceScope | null> {
    const { data: resourceScope, error } = await supabaseClient
      .from('resource_scopes')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(
        `Failed to fetch resource scope for conversation: ${error.message}`
      );
    }

    return this.transformFromDatabase(resourceScope);
  }

  /**
   * Validates that a user has access to a space
   */
  private async validateSpaceAccess(
    supabaseClient: SupabaseClient,
    spaceId: string,
    userId: string
  ): Promise<void> {
    const { data, error } = await supabaseClient
      .from('space_members')
      .select('profile_id')
      .eq('space_id', spaceId)
      .eq('profile_id', userId)
      .single();

    if (error || !data) {
      throw new Error('User does not have access to this space');
    }
  }

  /**
   * Validates that a user has access to a conversation
   */
  private async validateConversationAccess(
    supabaseClient: SupabaseClient,
    conversationId: string,
    userId: string
  ): Promise<void> {
    const { data, error } = await supabaseClient
      .from('conversation_members')
      .select('profile_id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', userId)
      .single();

    if (error || !data) {
      throw new Error('User does not have access to this conversation');
    }
  }

  /**
   * Creates a resource scope for a space (fallback method)
   * In normal operation, this is handled by database triggers
   */
  private async createSpaceResourceScope(
    supabaseClient: SupabaseClient,
    spaceId: string
  ): Promise<ResourceScope> {
    const { data: resourceScope, error } = await supabaseClient
      .from('resource_scopes')
      .insert({
        space_id: spaceId,
        conversation_id: null,
        environment: {},
        config: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create resource scope for space: ${error.message}`
      );
    }

    return this.transformFromDatabase(resourceScope);
  }

  /**
   * Creates a resource scope for a conversation (fallback method)
   * In normal operation, this is handled by database triggers
   */
  private async createConversationResourceScope(
    supabaseClient: SupabaseClient,
    conversationId: string
  ): Promise<ResourceScope> {
    const { data: resourceScope, error } = await supabaseClient
      .from('resource_scopes')
      .insert({
        space_id: null,
        conversation_id: conversationId,
        environment: {},
        config: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create resource scope for conversation: ${error.message}`
      );
    }

    return this.transformFromDatabase(resourceScope);
  }

  /**
   * Transforms database record to ResourceScope interface
   */
  private transformFromDatabase(dbRecord: any): ResourceScope {
    const scopeType = dbRecord.space_id ? 'space' : 'conversation';

    return {
      id: dbRecord.id,
      spaceId: dbRecord.space_id || undefined,
      conversationId: dbRecord.conversation_id || undefined,
      environment: dbRecord.environment || {},
      config: dbRecord.config || {},
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      scopeType,
    };
  }
}

export const resourceScopesService = new ResourceScopesService();
