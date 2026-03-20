import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { queueService } from './queue.service';

export class JobService {
  async createEventJob(data: { type: string; input: object }) {
    const { randomUUID } = await import('crypto');
    const jobId = randomUUID();

    const input = data.input as Record<string, unknown>;
    const agentId = input.agentId as string | undefined;

    const { data: job, error } = await adminSupabase
      .schema('core_automation')
      .from('jobs')
      .insert({
        id: jobId,
        type: data.type,
        input_type: 'event',
        input: {
          inputType: 'event',
          ...data.input,
        },
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
    filters: { status?: string; type?: string } = {}
  ) {
    let q = userClient
      .schema('core_automation')
      .from('get_jobs_for_current_user')
      .select('*');
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.type) q = q.eq('type', filters.type);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return {
      jobs: (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        inputType: row.input_type,
        status: row.status,
        input: row.input,
        output: row.output,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        threadId: row.thread_id,
        agentId: row.agent_id,
      })),
      total: data?.length || 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getJobsForUser(
    userClient: SupabaseClient,
    filters: { status?: string; type?: string } = {}
  ) {
    return this.listJobs(userClient, filters);
  }

  async getJob(userClient: SupabaseClient, jobId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      threadId: data.thread_id,
      agentId: data.agent_id,
    };
  }

  async createJob(
    userClient: SupabaseClient,
    _userId: string,
    data: { type: string; input: object }
  ) {
    const jobId = require('crypto').randomUUID();

    const { error } = await adminSupabase
      .schema('core_automation')
      .from('jobs')
      .insert({
        id: jobId,
        type: data.type,
        input_type: 'manual',
        input: data.input,
      });

    if (error) throw new Error(error.message);

    await queueService.addJob('main-queue', data.type, { jobId });

    return {
      jobId,
      status: 'queued',
    };
  }

  async cancelJob(userClient: SupabaseClient, jobId: string) {
    await this.getJob(userClient, jobId);

    const { data: job, error } = await adminSupabase
      .schema('core_automation')
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
      .schema('core_automation')
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

    const { error } = await adminSupabase
      .schema('core_automation')
      .from('jobs')
      .delete()
      .eq('id', jobId);
    if (error) throw new Error('Cannot delete job');
    return { success: true };
  }
}

export const jobService = new JobService();
