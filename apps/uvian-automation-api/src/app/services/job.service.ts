import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { queueService } from './queue.service';

export class JobService {
  private async verifyResourceScopeAccess(
    userClient: SupabaseClient,
    resourceScopeId: string
  ) {
    const { data: scope } = await userClient
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', resourceScopeId)
      .single();

    if (!scope) throw new Error('Resource scope not found');

    if (scope.space_id) {
      const { data: member } = await userClient
        .from('space_members')
        .select('id')
        .eq('space_id', scope.space_id)
        .single();
      if (!member) throw new Error('Not a member of this space');
    } else if (scope.conversation_id) {
      const { data: member } = await userClient
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', scope.conversation_id)
        .single();
      if (!member) throw new Error('Not a member of this conversation');
    }
  }

  async createEventJob(data: {
    type: string;
    input: object;
    executor?: string;
  }) {
    const { randomUUID } = await import('crypto');
    const jobId = randomUUID();

    const input = data.input as Record<string, unknown>;
    const agentId = input.agentId as string | undefined;

    const { data: job, error } = await adminSupabase
      .from('jobs')
      .insert({
        id: jobId,
        type: data.type,
        input_type: 'event',
        input: {
          inputType: 'event',
          ...data.input,
        },
        resource_scope_id: null,
        agent_id: agentId || null,
      })
      .select()
      .single();

    if (error || !job) {
      console.error('Failed to create job in DB:', error);
      throw new Error(
        `Failed to create job: ${error?.message || 'Unknown error'}`
      );
    }

    await queueService.addJob('main-queue', data.type, { jobId });

    return jobId;
  }

  async listJobs(
    userClient: SupabaseClient,
    filters: {
      spaceId?: string;
      conversationId?: string;
      status?: string;
      type?: string;
    }
  ) {
    let viewName = 'get_jobs_for_space';
    if (filters.conversationId) {
      viewName = 'get_jobs_for_conversation';
    }

    let q = userClient.from(viewName).select('*');

    if (filters.spaceId) q = q.eq('space_id', filters.spaceId);
    if (filters.conversationId)
      q = q.eq('conversation_id', filters.conversationId);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.type) q = q.eq('type', filters.type);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return {
      jobs: (data || []).map((row) => ({
        id: row.id,
        type: row.type,
        inputType: row.input_type,
        status: row.status,
        input: row.input,
        output: row.output,
        errorMessage: row.error_message,
        resourceScopeId: row.resource_scope_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        spaceId: row.space_id,
        conversationId: row.conversation_id,
      })),
      total: data?.length || 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getJobsForUser(
    userClient: SupabaseClient,
    filters: { status?: string; type?: string }
  ) {
    let q = userClient.from('get_jobs_for_current_user').select('*');
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.type) q = q.eq('type', filters.type);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return {
      jobs: (data || []).map((row) => ({
        id: row.id,
        type: row.type,
        inputType: row.input_type,
        status: row.status,
        input: row.input,
        output: row.output,
        errorMessage: row.error_message,
        resourceScopeId: row.resource_scope_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        spaceId: row.space_id,
        conversationId: row.conversation_id,
      })),
      total: data?.length || 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getJob(userClient: SupabaseClient, jobId: string) {
    const { data, error } = await userClient
      .from('get_job_details')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) throw new Error('Job not found');

    return {
      id: data.id,
      type: data.type,
      inputType: data.input_type,
      status: data.status,
      input: data.input,
      output: data.output,
      errorMessage: data.error_message,
      resourceScopeId: data.resource_scope_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      spaceId: data.space_id,
      conversationId: data.conversation_id,
    };
  }

  async createJob(
    userClient: SupabaseClient,
    userId: string,
    data: { type: string; input: object; resourceScopeId: string }
  ) {
    await this.verifyResourceScopeAccess(userClient, data.resourceScopeId);

    const jobId = require('crypto').randomUUID();

    const { data: job, error } = await adminSupabase
      .from('jobs')
      .insert({
        id: jobId,
        type: data.type,
        input: data.input,
        resource_scope_id: data.resourceScopeId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await queueService.addJob('main-queue', data.type, { jobId });

    const { data: scope } = await adminSupabase
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', data.resourceScopeId)
      .single();

    return {
      jobId,
      status: 'queued',
      resourceScopeId: job.resource_scope_id,
      spaceId: scope?.space_id,
      conversationId: scope?.conversation_id,
    };
  }

  async cancelJob(userClient: SupabaseClient, jobId: string) {
    await this.getJob(userClient, jobId);

    const { data: job, error } = await adminSupabase
      .from('jobs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('status', 'queued')
      .select()
      .single();

    if (error || !job) throw new Error('Cannot cancel job');

    return {
      id: job.id,
      type: job.type,
      inputType: job.input_type,
      status: job.status,
      updatedAt: job.updated_at,
      completedAt: job.completed_at,
    };
  }

  async retryJob(userClient: SupabaseClient, jobId: string) {
    await this.getJob(userClient, jobId);

    const { data: job, error } = await adminSupabase
      .from('jobs')
      .update({
        status: 'queued',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'failed')
      .select()
      .single();

    if (error || !job) throw new Error('Cannot retry job');

    await queueService.addJob('main-queue', job.type, { jobId });

    return {
      id: job.id,
      type: job.type,
      inputType: job.input_type,
      status: job.status,
      errorMessage: job.error_message,
      updatedAt: job.updated_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    };
  }

  async deleteJob(userClient: SupabaseClient, jobId: string) {
    await this.getJob(userClient, jobId);

    const { error } = await adminSupabase.from('jobs').delete().eq('id', jobId);
    if (error) throw new Error('Cannot delete job');
    return { success: true };
  }

  async getJobMetrics(userClient: SupabaseClient, spaceId: string) {
    const { data, error } = await userClient
      .from('get_jobs_for_space')
      .select('status')
      .eq('space_id', spaceId);

    if (error) throw new Error(error.message);

    const statusCounts = (data || []).reduce((acc, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data?.length || 0,
      queued: statusCounts.queued || 0,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      cancelled: statusCounts.cancelled || 0,
      averageProcessingTime: 0,
    };
  }
}

export const jobService = new JobService();
