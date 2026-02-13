import { SupabaseClient } from '@supabase/supabase-js';
import {
  Job,
  JobFilters,
  JobListResponse,
  PaginationOptions,
} from '../types/job.types';

export class JobService {
  async createJob(
    supabaseClient: SupabaseClient,
    data: {
      id: string;
      type: string;
      input: Record<string, any>;
    }
  ): Promise<Job> {
    const { data: job, error } = await supabaseClient
      .from('jobs')
      .insert({
        id: data.id,
        type: data.type,
        status: 'queued',
        input: data.input || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return job;
  }

  async listJobs(
    supabaseClient: SupabaseClient,
    filters: JobFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<JobListResponse> {
    let query = supabaseClient.from('jobs').select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
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

    const total = count || 0;
    const totalPages = Math.ceil(total / pagination.limit);
    const hasMore = pagination.page < totalPages;

    return {
      jobs: data || [],
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore,
    };
  }

  async getJob(supabaseClient: SupabaseClient, id: string): Promise<Job> {
    const { data: job, error } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    return job;
  }

  async cancelJob(supabaseClient: SupabaseClient, id: string): Promise<Job> {
    // Check if job can be cancelled
    const job = await this.getJob(supabaseClient, id);
    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }

    // Update job status
    const { data: updatedJob, error } = await supabaseClient
      .from('jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel job: ${error.message}`);
    }

    return updatedJob;
  }

  async retryJob(supabaseClient: SupabaseClient, id: string): Promise<Job> {
    // Check if job can be retried
    const job = await this.getJob(supabaseClient, id);
    if (!['failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot retry job with status: ${job.status}`);
    }

    // Update job status back to queued
    const { data: updatedJob, error } = await supabaseClient
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
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to retry job: ${error.message}`);
    }

    return updatedJob;
  }

  async deleteJob(supabaseClient: SupabaseClient, id: string): Promise<void> {
    // Check if job can be deleted
    const job = await this.getJob(supabaseClient, id);
    if (job.status === 'processing') {
      throw new Error(`Cannot delete job with status: ${job.status}`);
    }

    // Delete job
    const { error } = await supabaseClient.from('jobs').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  async updateJobStatus(
    supabaseClient: SupabaseClient,
    id: string,
    status: Job['status'],
    errorMessage?: string
  ): Promise<Job> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timing fields based on status
    if (status === 'processing' && !('started_at' in updates)) {
      updates.started_at = new Date().toISOString();
    }

    if (['completed', 'failed', 'cancelled'].includes(status)) {
      updates.completed_at = new Date().toISOString();
    }

    if (status === 'failed' && errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data: updatedJob, error } = await supabaseClient
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }

    return updatedJob;
  }

  async getJobMetrics(
    supabaseClient: SupabaseClient,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabaseClient.from('jobs').select('status, created_at');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch job metrics: ${error.message}`);
    }

    const metrics = {
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
}

export const jobService = new JobService();
