import { SupabaseClient } from '@supabase/supabase-js';
import {
  Ticket,
  TicketFilters,
  TicketListResponse,
  PaginationOptions,
  TicketMetrics,
} from '../types/ticket.types';
import { ResourceScope } from '../types/job.types';
import { resourceScopesService } from './resource-scopes.service';
import { adminSupabase } from '../clients/supabase.client';

export class TicketService {
  /**
   * SECURITY: Verifies the Auth User actually owns the profile.
   * This prevents User A from performing actions as User B (Spoofing).
   */
  private async verifyProfileOwnership(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<void> {
    const { data, error } = await userClient
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      throw new Error('Unauthorized: You do not own this profile');
    }
  }

  /**
   * Validates access to a specific resource scope (following established pattern)
   */
  private async validateResourceScopeAccess(
    userClient: SupabaseClient,
    resourceScopeId: string,
    profileId: string
  ): Promise<void> {
    // Get resource scope details
    const { data: resourceScope, error } = await userClient
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', resourceScopeId)
      .single();

    if (error || !resourceScope) {
      throw new Error('Resource scope not found');
    }

    // Validate access based on scope type
    if (resourceScope.space_id) {
      await this.validateSpaceAccess(
        userClient,
        resourceScope.space_id,
        profileId
      );
    } else if (resourceScope.conversation_id) {
      await this.validateConversationAccess(
        userClient,
        resourceScope.conversation_id,
        profileId
      );
    } else {
      throw new Error('Invalid resource scope configuration');
    }
  }

  /**
   * Validates space access (simplified version for direct validation)
   */
  private async validateSpaceAccess(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<void> {
    const { data: spaceMember, error } = await userClient
      .from('space_members')
      .select('space_id')
      .eq('space_id', spaceId)
      .eq('profile_id', profileId)
      .single();

    if (error || !spaceMember) {
      throw new Error('Unauthorized: You are not a member of this space');
    }
  }

  /**
   * Validates conversation access (simplified version for direct validation)
   */
  private async validateConversationAccess(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string
  ): Promise<void> {
    const { data: conversationMember, error } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId)
      .single();

    if (error || !conversationMember) {
      throw new Error(
        'Unauthorized: You are not a member of this conversation'
      );
    }
  }

  /**
   * Validates space access and returns resource scope (following established pattern)
   */
  private async validateSpaceAccessAndGetScope(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<ResourceScope> {
    // Validate access
    await this.validateSpaceAccess(userClient, spaceId, profileId);

    // Get the resource scope
    const resourceScope =
      await resourceScopesService.getOrCreateSpaceResourceScope(
        userClient,
        spaceId
      );

    return resourceScope;
  }

  /**
   * Validates conversation access and returns resource scope (following established pattern)
   */
  private async validateConversationAccessAndGetScope(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string
  ): Promise<ResourceScope> {
    // Validate access
    await this.validateConversationAccess(
      userClient,
      conversationId,
      profileId
    );

    // Get the resource scope
    const resourceScope =
      await resourceScopesService.getOrCreateConversationResourceScope(
        userClient,
        conversationId
      );

    return resourceScope;
  }

  async createTicket(
    userClient: SupabaseClient,
    profileId: string,
    data: {
      threadId: string;
      resourceScopeId: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string;
      requesterJobId?: string;
    }
  ): Promise<Ticket> {
    // SECURITY: Verify Profile Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    await this.validateResourceScopeAccess(
      userClient,
      data.resourceScopeId,
      profileId
    );

    const ticketData = {
      thread_id: data.threadId,
      resource_scope_id: data.resourceScopeId,
      requester_job_id: data.requesterJobId || null,
      status: 'open',
      priority: data.priority || 'medium',
      title: data.title,
      description: data.description || null,
      resolution_payload: null,
      assigned_to: data.assignedTo || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: ticket, error } = await adminSupabase
      .from('tickets')
      .insert(ticketData)
      .select(
        `
          *,
          resource_scopes!tickets_resource_scope_id_fkey(
            id,
            space_id,
            conversation_id
          ),
          profiles!tickets_assigned_to_fkey(
            id,
            display_name,
            avatar_url
          )
        `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }

    return this.transformFromDatabase(ticket);
  }

  async listTickets(
    userClient: SupabaseClient,
    filters: TicketFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<TicketListResponse> {
    let query = userClient.from('tickets').select(
      `
        *,
        resource_scopes!tickets_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        ),
        profiles!tickets_assigned_to_fkey(
          id,
          display_name,
          avatar_url
        )
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.threadId) {
      query = query.eq('thread_id', filters.threadId);
    }

    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply resource scope filters
    if (filters.spaceId) {
      query = query.eq('resource_scopes.space_id', filters.spaceId);
    }

    if (filters.conversationId) {
      query = query.eq(
        'resource_scopes.conversation_id',
        filters.conversationId
      );
    }

    // Apply sorting (newest first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }

    const tickets = (data || []).map(this.transformFromDatabase);
    const total = count || 0;
    const totalPages = Math.ceil(total / pagination.limit);
    const hasMore = pagination.page < totalPages;

    return {
      tickets,
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore,
    };
  }

  /**
   * Lists tickets for a specific space (with access validation - following established pattern)
   */
  async listSpaceTickets(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string,
    filters: Omit<TicketFilters, 'spaceId' | 'conversationId'> = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<TicketListResponse> {
    // Validate access FIRST (following established pattern)
    await this.validateSpaceAccessAndGetScope(userClient, spaceId, profileId);

    return this.listTickets(userClient, { ...filters, spaceId }, pagination);
  }

  /**
   * Lists tickets for a specific conversation (with access validation - following established pattern)
   */
  async listConversationTickets(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string,
    filters: Omit<TicketFilters, 'spaceId' | 'conversationId'> = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<TicketListResponse> {
    // Validate access FIRST (following established pattern)
    await this.validateConversationAccessAndGetScope(
      userClient,
      conversationId,
      profileId
    );

    return this.listTickets(
      userClient,
      { ...filters, conversationId },
      pagination
    );
  }

  async getTicket(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<Ticket> {
    // Get ticket with resource scope info first
    const { data: ticket, error } = await userClient
      .from('tickets')
      .select(
        `
        *,
        resource_scopes!tickets_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        ),
        profiles!tickets_assigned_to_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }

    // Validate access if profileId provided (following established pattern)
    if (profileId) {
      await this.validateTicketAccess(userClient, ticket, profileId);
    }

    return this.transformFromDatabase(ticket);
  }

  async updateTicket(
    userClient: SupabaseClient,
    id: string,
    profileId: string,
    updates: {
      title?: string;
      description?: string;
      status?: 'open' | 'in_progress' | 'resolved' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string | null;
      resolutionPayload?: Record<string, any> | null;
    }
  ): Promise<Ticket> {
    // SECURITY: Verify Profile Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    // Get ticket with resource scope info for access validation
    await this.getTicket(userClient, id, profileId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined)
      updateData.assigned_to = updates.assignedTo;
    if (updates.resolutionPayload !== undefined) {
      updateData.resolution_payload = updates.resolutionPayload;
    }

    // Use admin client for write operation (following established pattern)
    const { data: updatedTicket, error } = await adminSupabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        resource_scopes!tickets_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        ),
        profiles!tickets_assigned_to_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return this.transformFromDatabase(updatedTicket);
  }

  async resolveTicket(
    userClient: SupabaseClient,
    id: string,
    profileId: string,
    resolutionPayload: Record<string, any>
  ): Promise<Ticket> {
    // SECURITY: Verify Profile Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    // Get ticket with resource scope info for access validation
    const existingTicket = await this.getTicket(userClient, id, profileId);

    if (existingTicket.status === 'resolved') {
      throw new Error('Ticket is already resolved');
    }

    // Use admin client for write operation (following established pattern)
    const { data: updatedTicket, error } = await adminSupabase
      .from('tickets')
      .update({
        status: 'resolved',
        resolution_payload: resolutionPayload,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        resource_scopes!tickets_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        ),
        profiles!tickets_assigned_to_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to resolve ticket: ${error.message}`);
    }

    return this.transformFromDatabase(updatedTicket);
  }

  async assignTicket(
    userClient: SupabaseClient,
    id: string,
    profileId: string,
    assignedTo: string | null
  ): Promise<Ticket> {
    // SECURITY: Verify Profile Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    // Get ticket with resource scope info for access validation
    await this.getTicket(userClient, id, profileId);

    // Use admin client for write operation (following established pattern)
    const { data: updatedTicket, error } = await adminSupabase
      .from('tickets')
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        resource_scopes!tickets_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        ),
        profiles!tickets_assigned_to_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to assign ticket: ${error.message}`);
    }

    return this.transformFromDatabase(updatedTicket);
  }

  async deleteTicket(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<void> {
    // SECURITY: Verify Profile Ownership if profileId provided
    if (profileId) {
      await this.verifyProfileOwnership(userClient, profileId);
    }

    // Get ticket with resource scope info for access validation
    await this.getTicket(userClient, id, profileId);

    // Use admin client for delete operation (following established pattern)
    const { error } = await adminSupabase.from('tickets').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  /**
   * Validates that a user has access to a ticket based on its resource scope (following established pattern)
   */
  private async validateTicketAccess(
    userClient: SupabaseClient,
    ticket: any,
    profileId: string
  ): Promise<void> {
    const resourceScope = ticket.resource_scopes;

    if (!resourceScope) {
      throw new Error('Ticket resource scope not found');
    }

    // Validate access based on scope type
    if (resourceScope.space_id) {
      await this.validateSpaceAccess(
        userClient,
        resourceScope.space_id,
        profileId
      );
    } else if (resourceScope.conversation_id) {
      await this.validateConversationAccess(
        userClient,
        resourceScope.conversation_id,
        profileId
      );
    }
  }

  /**
   * Transforms database record to Ticket interface
   */
  private transformFromDatabase(dbRecord: any): Ticket {
    const resourceScope = dbRecord.resource_scopes;
    const assignedProfile = dbRecord.profiles;

    return {
      id: dbRecord.id,
      threadId: dbRecord.thread_id,
      resourceScopeId: dbRecord.resource_scope_id,
      requesterJobId: dbRecord.requester_job_id,
      status: dbRecord.status,
      priority: dbRecord.priority,
      title: dbRecord.title,
      description: dbRecord.description,
      resolutionPayload: dbRecord.resolution_payload,
      assignedTo: dbRecord.assigned_to,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      resolvedAt: dbRecord.resolved_at,
      // Enhanced fields
      spaceId: resourceScope?.space_id,
      conversationId: resourceScope?.conversation_id,
      scopeType: resourceScope?.space_id ? 'space' : 'conversation',
      assignedProfile: assignedProfile
        ? {
            id: assignedProfile.id,
            displayName: assignedProfile.display_name,
            avatarUrl: assignedProfile.avatar_url,
          }
        : undefined,
    };
  }

  /**
   * Gets ticket metrics for a given scope or overall
   */
  async getTicketMetrics(
    userClient: SupabaseClient,
    profileId?: string,
    filters: {
      spaceId?: string;
      conversationId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<TicketMetrics> {
    let query = userClient.from('tickets').select(
      `
        status,
        created_at,
        resolved_at
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply resource scope filters if provided
    if (filters.spaceId) {
      // First validate access to space
      if (profileId) {
        await this.validateSpaceAccess(userClient, filters.spaceId, profileId);
      }
      // Join with resource_scopes to filter by space
      query = query.eq('resource_scopes.space_id', filters.spaceId);
    } else if (filters.conversationId) {
      // First validate access to conversation
      if (profileId) {
        await this.validateConversationAccess(
          userClient,
          filters.conversationId,
          profileId
        );
      }
      // Join with resource_scopes to filter by conversation
      query = query.eq(
        'resource_scopes.conversation_id',
        filters.conversationId
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch ticket metrics: ${error.message}`);
    }

    const tickets = data || [];
    const total = count || 0;

    // Calculate metrics
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const cancelled = tickets.filter((t) => t.status === 'cancelled').length;

    // Calculate average resolution time for resolved tickets
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' && t.resolved_at
    );
    let averageResolutionTime: number | undefined;

    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at).getTime();
        const resolved = new Date(ticket.resolved_at).getTime();
        return sum + (resolved - created);
      }, 0);

      averageResolutionTime = Math.round(
        totalResolutionTime / resolvedTickets.length
      );
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      cancelled,
      averageResolutionTime,
    };
  }
}

export const ticketService = new TicketService();
