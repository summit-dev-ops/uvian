import { SupabaseClient } from '@supabase/supabase-js';
import {
  Job,
  JobFilters,
  JobListResponse,
  PaginationOptions,
  JobMetrics,
  ResourceScope,
} from '../types/job.types';
import { resourceScopesService } from './resource-scopes.service';
import { adminSupabase } from '../clients/supabase.client';

export class JobService {
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

  async createJob(
    userClient: SupabaseClient,
    profileId: string,
    data: {
      id: string;
      type: 'chat' | 'task' | 'agent';
      input: Record<string, any>;
      resourceScopeId: string;
      threadId?: string; // For agent jobs
    }
  ): Promise<Job> {
    // SECURITY: Verify Profile Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    await this.validateResourceScopeAccess(
      userClient,
      data.resourceScopeId,
      profileId
    );
    const jobData: any = {
      id: data.id,
      type: data.type,
      status: 'queued',
      input: data.input || {},
      resource_scope_id: data.resourceScopeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add thread_id for agent jobs
    if (data.type === 'agent' && data.threadId) {
      jobData.thread_id = data.threadId;
    }

    const { data: job, error } = await adminSupabase
      .from('jobs')
      .insert(jobData)
      .select(
        `
          *,
          resource_scopes!jobs_resource_scope_id_fkey(
            id,
            space_id,
            conversation_id
          )
        `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return this.transformFromDatabase(job);
  }

  /**
   * Validates access to a specific resource scope
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
   * Validates space access and gets resource scope (following established pattern)
   */
  private async validateSpaceAccessAndGetScope(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<ResourceScope> {
    // Validate that user is a member of the space
    const { data: spaceMember, error } = await userClient
      .from('space_members')
      .select('space_id')
      .eq('space_id', spaceId)
      .eq('profile_id', profileId)
      .single();

    if (error || !spaceMember) {
      throw new Error('Unauthorized: You are not a member of this space');
    }

    // Get or create the resource scope
    const resourceScope =
      await resourceScopesService.getOrCreateSpaceResourceScope(
        userClient,
        spaceId
      );

    return resourceScope;
  }

  /**
   * Validates conversation access and gets resource scope (following established pattern)
   */
  private async validateConversationAccessAndGetScope(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string
  ): Promise<ResourceScope> {
    // Validate that user is a member of the conversation
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

    // Get or create the resource scope
    const resourceScope =
      await resourceScopesService.getOrCreateConversationResourceScope(
        userClient,
        conversationId
      );

    return resourceScope;
  }

  async listJobs(
    userClient: SupabaseClient,
    filters: JobFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<JobListResponse> {
    let query = userClient.from('jobs').select(
      `
        *,
        resource_scopes!jobs_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        )
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Thread ID filter for agent jobs
    if (filters.threadId) {
      query = query.eq('thread_id', filters.threadId);
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
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    const jobs = (data || []).map(this.transformFromDatabase);
    const total = count || 0;
    const totalPages = Math.ceil(total / pagination.limit);
    const hasMore = pagination.page < totalPages;

    return {
      jobs,
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore,
    };
  }

  /**
   * Lists jobs for a specific space (with access validation - following established pattern)
   */
  async listSpaceJobs(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string,
    filters: Omit<JobFilters, 'spaceId' | 'conversationId'> = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<JobListResponse> {
    // Validate access FIRST (following established pattern)
    await this.validateSpaceAccessAndGetScope(userClient, spaceId, profileId);

    return this.listJobs(userClient, { ...filters, spaceId }, pagination);
  }

  /**
   * Lists jobs for a specific conversation (with access validation - following established pattern)
   */
  async listConversationJobs(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string,
    filters: Omit<JobFilters, 'spaceId' | 'conversationId'> = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<JobListResponse> {
    // Validate access FIRST (following established pattern)
    await this.validateConversationAccessAndGetScope(
      userClient,
      conversationId,
      profileId
    );

    return this.listJobs(
      userClient,
      { ...filters, conversationId },
      pagination
    );
  }

  async getJob(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<Job> {
    // Get job with resource scope info first
    const { data: job, error } = await userClient
      .from('jobs')
      .select(
        `
        *,
        resource_scopes!jobs_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    // Validate access if profileId provided (following established pattern)
    if (profileId) {
      await this.validateJobAccess(userClient, job, profileId);
    }

    return this.transformFromDatabase(job);
  }

  async cancelJob(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<Job> {
    // SECURITY: Verify Profile Ownership if profileId provided
    if (profileId) {
      await this.verifyProfileOwnership(userClient, profileId);
    }

    // Get job with resource scope info for access validation
    const job = await this.getJob(userClient, id, profileId);

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }

    // Use admin client for write operation (following established pattern)
    const { data: updatedJob, error } = await adminSupabase
      .from('jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        resource_scopes!jobs_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to cancel job: ${error.message}`);
    }

    return this.transformFromDatabase(updatedJob);
  }

  async retryJob(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<Job> {
    // SECURITY: Verify Profile Ownership if profileId provided
    if (profileId) {
      await this.verifyProfileOwnership(userClient, profileId);
    }

    // Get job with resource scope info for access validation
    const job = await this.getJob(userClient, id, profileId);

    if (!['failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot retry job with status: ${job.status}`);
    }

    // Use admin client for write operation (following established pattern)
    const { data: updatedJob, error } = await adminSupabase
      .from('jobs')
      .update({
        status: 'queued',
        error_message: null,
        updated_at: new Date().toISOString(),
        // Reset timing fields
        started_at: null,
        completed_at: null,
      })
      .eq('id', id)
      .select(
        `
        *,
        resource_scopes!jobs_resource_scope_id_fkey(
          id,
          space_id,
          conversation_id
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to retry job: ${error.message}`);
    }

    return this.transformFromDatabase(updatedJob);
  }

  async deleteJob(
    userClient: SupabaseClient,
    id: string,
    profileId?: string
  ): Promise<void> {
    // SECURITY: Verify Profile Ownership if profileId provided
    if (profileId) {
      await this.verifyProfileOwnership(userClient, profileId);
    }

    // Get job with resource scope info for access validation
    const job = await this.getJob(userClient, id, profileId);

    if (job.status === 'processing') {
      throw new Error(`Cannot delete job with status: ${job.status}`);
    }

    // Use admin client for delete operation (following established pattern)
    const { error } = await adminSupabase.from('jobs').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  async getJobMetrics(
    userClient: SupabaseClient,
    profileId?: string,
    dateFrom?: string,
    dateTo?: string,
    spaceId?: string,
    conversationId?: string
  ): Promise<JobMetrics> {
    // Validate access if scope is provided (use lightweight validation)
    if (spaceId && profileId) {
      await this.validateSpaceAccess(userClient, spaceId, profileId);
    } else if (conversationId && profileId) {
      await this.validateConversationAccess(
        userClient,
        conversationId,
        profileId
      );
    }

    let query = userClient.from('jobs').select(`
        status, 
        created_at,
        resource_scopes!jobs_resource_scope_id_fkey(space_id, conversation_id)
      `);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (spaceId) {
      query = query.eq('resource_scopes.space_id', spaceId);
    }

    if (conversationId) {
      query = query.eq('resource_scopes.conversation_id', conversationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch job metrics: ${error.message}`);
    }

    const metrics: JobMetrics = {
      total: data.length,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    data.forEach((job) => {
      if (job.status in metrics) {
        (metrics as any)[job.status]++;
      }
    });

    return metrics;
  }

  /**
   * Validates that a user has access to a job based on its resource scope (following established pattern)
   */
  private async validateJobAccess(
    userClient: SupabaseClient,
    job: any,
    profileId: string
  ): Promise<void> {
    const resourceScope = job.resource_scopes;

    if (!resourceScope) {
      throw new Error('Job resource scope not found');
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
   * Transforms database record to Job interface
   */
  private transformFromDatabase(dbRecord: any): Job {
    const resourceScope = dbRecord.resource_scopes;

    return {
      id: dbRecord.id,
      type: dbRecord.type,
      status: dbRecord.status,
      input: dbRecord.input || {},
      output: dbRecord.output,
      errorMessage: dbRecord.error_message,
      resourceScopeId: dbRecord.resource_scope_id,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      startedAt: dbRecord.started_at,
      completedAt: dbRecord.completed_at,
      // Enhanced fields
      spaceId: resourceScope?.space_id,
      conversationId: resourceScope?.conversation_id,
      scopeType: resourceScope?.space_id ? 'space' : 'conversation',
      // Agent-specific fields
      threadId: dbRecord.thread_id,
    };
  }
}

export const jobService = new JobService();
