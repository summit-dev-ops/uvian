import { randomUUID } from 'crypto';
import {
  ServiceClients,
  JobScopedService,
  CreateEventJobPayload,
  CreateJobPayload,
  ListJobsFilters,
  ListJobsResult,
  JobRecord,
} from './types';
import { queueService } from '../factory';

export function createJobScopedService(
  clients: ServiceClients,
): JobScopedService {
  async function getJobInternal(jobId: string): Promise<JobRecord> {
    const { data, error } = await clients.userClient
      .schema('core_automation')
      .from('get_job_details')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) throw new Error('Job not found');
    return mapRow(data);
  }

  return {
    async createEventJob(payload: CreateEventJobPayload): Promise<string> {
      const jobId = randomUUID();

      const { data: job, error } = await clients.adminClient
        .schema('core_automation')
        .from('jobs')
        .insert({
          id: jobId,
          type: payload.type,
          input: {
            inputType: 'event',
            ...payload.input,
          },
        })
        .select()
        .single();

      if (error || !job) {
        console.error('Failed to create job in DB:', error);
        throw new Error(
          `Failed to create job: ${error?.message || 'Unknown error'}`,
        );
      }

      await queueService.addJob('main-queue', payload.type, { jobId });

      return jobId;
    },

    async createJob(
      payload: CreateJobPayload,
    ): Promise<{ jobId: string; status: string }> {
      const jobId = randomUUID();

      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('jobs')
        .insert({
          id: jobId,
          type: payload.type,
          input: payload.input,
        });

      if (error) throw new Error(error.message);

      await queueService.addJob('main-queue', payload.type, { jobId });

      return {
        jobId,
        status: 'queued',
      };
    },

    async listJobs(filters: ListJobsFilters = {}): Promise<ListJobsResult> {
      let q = clients.userClient
        .schema('core_automation')
        .from('get_jobs_for_current_user')
        .select('*');
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.type) q = q.eq('type', filters.type);

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      return {
        jobs: (data || []).map((row: unknown) => mapRow(row)),
        total: data?.length || 0,
        page: 1,
        limit: 20,
        hasMore: false,
      };
    },

    async getJobsForUser(
      filters: ListJobsFilters = {},
    ): Promise<ListJobsResult> {
      return this.listJobs(filters);
    },

    async getJob(jobId: string): Promise<JobRecord> {
      return getJobInternal(jobId);
    },

    async cancelJob(jobId: string): Promise<JobRecord> {
      await getJobInternal(jobId);

      const { data: job, error } = await clients.adminClient
        .schema('core_automation')
        .from('jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('status', 'queued')
        .select()
        .single();

      if (error || !job) throw new Error('Cannot cancel job');

      return mapRow(job);
    },

    async retryJob(jobId: string): Promise<JobRecord> {
      await getJobInternal(jobId);

      const { data: job, error } = await clients.adminClient
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

      return mapRow(job);
    },

    async deleteJob(jobId: string): Promise<{ success: boolean }> {
      await getJobInternal(jobId);

      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('jobs')
        .delete()
        .eq('id', jobId);
      if (error) throw new Error('Cannot delete job');
      return { success: true };
    },
  };
}

function mapRow(row: unknown): JobRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    type: r.type as string,
    status: r.status as string,
    input: r.input as Record<string, unknown>,
    output: r.output as Record<string, unknown> | null,
    errorMessage: r.error_message as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    startedAt: r.started_at as string | null,
    completedAt: r.completed_at as string | null,
  };
}
