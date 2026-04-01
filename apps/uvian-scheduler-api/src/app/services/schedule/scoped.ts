import { randomUUID } from 'crypto';
import {
  ServiceClients,
  ScheduleScopedService,
  CreateScheduleInput,
  ListSchedulesFilters,
  ListSchedulesResult,
  Schedule,
  ScheduleStatus,
} from './types';

export function createScheduleScopedService(
  clients: ServiceClients
): ScheduleScopedService {
  async function getScheduleInternal(id: string): Promise<Schedule> {
    const { data, error } = await clients.adminClient
      .schema('core_automation')
      .from('scheduled_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error('Schedule not found');
    return mapRow(data);
  }

  return {
    async createSchedule(
      userId: string,
      input: CreateScheduleInput
    ): Promise<Schedule> {
      const scheduleId = randomUUID();
      const now = new Date().toISOString();

      const { data: schedule, error } = await clients.adminClient
        .schema('core_automation')
        .from('scheduled_tasks')
        .insert({
          id: scheduleId,
          user_id: userId,
          agent_id: input.agentId,
          description: input.description,
          schedule_type: input.scheduleType || 'one_time',
          scheduled_for: input.scheduledFor,
          cron_expression: input.cronExpression || null,
          status: 'pending',
          retry_count: 0,
          max_retries: 3,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error || !schedule) {
        console.error('Failed to create schedule:', error);
        throw new Error(
          `Failed to create schedule: ${error?.message || 'Unknown error'}`
        );
      }

      return mapRow(schedule);
    },

    async listSchedules(
      userId: string,
      filters?: ListSchedulesFilters
    ): Promise<ListSchedulesResult> {
      let query = clients.adminClient
        .schema('core_automation')
        .from('scheduled_tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.cursor) {
        query = query.lt('scheduled_for', filters.cursor);
      }

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      const schedules = (data || []).map((row) => mapRow(row));

      return {
        schedules,
        total: count || 0,
        page: 1,
        limit: filters?.limit || 20,
        hasMore: schedules.length === (filters?.limit || 20),
      };
    },

    async getSchedule(userId: string, id: string): Promise<Schedule> {
      const schedule = await getScheduleInternal(id);
      if (schedule.userId !== userId) {
        throw new Error('Not authorized to access this schedule');
      }
      return schedule;
    },

    async cancelSchedule(userId: string, id: string): Promise<Schedule> {
      const schedule = await getScheduleInternal(id);
      if (schedule.userId !== userId) {
        throw new Error('Not authorized to cancel this schedule');
      }

      if (schedule.status !== 'pending' && schedule.status !== 'queued') {
        throw new Error('Cannot cancel schedule that is not pending or queued');
      }

      const { data: updated, error } = await clients.adminClient
        .schema('core_automation')
        .from('scheduled_tasks')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) throw new Error('Failed to cancel schedule');

      return mapRow(updated);
    },

    async markCompleted(id: string): Promise<Schedule> {
      const { data: updated, error } = await clients.adminClient
        .schema('core_automation')
        .from('scheduled_tasks')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'queued')
        .select()
        .single();

      if (error || !updated)
        throw new Error('Failed to mark schedule as completed');

      return mapRow(updated);
    },

    async markFailed(id: string, errorMessage: string): Promise<Schedule> {
      const schedule = await getScheduleInternal(id);

      if (schedule.retryCount >= schedule.maxRetries) {
        const { data: updated, error } = await clients.adminClient
          .schema('core_automation')
          .from('scheduled_tasks')
          .update({
            status: 'failed',
            last_error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error || !updated)
          throw new Error('Failed to mark schedule as failed');
        return mapRow(updated);
      }

      const { data: updated, error } = await clients.adminClient
        .schema('core_automation')
        .from('scheduled_tasks')
        .update({
          retry_count: schedule.retryCount + 1,
          last_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !updated)
        throw new Error('Failed to update schedule retry count');

      return mapRow(updated);
    },
  };
}

function mapRow(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    agentId: row.agent_id as string,
    description: row.description as string,
    scheduleType: row.schedule_type as 'one_time' | 'recurring',
    scheduledFor: row.scheduled_for as string,
    cronExpression: row.cron_expression as string | null,
    status: row.status as ScheduleStatus,
    retryCount: row.retry_count as number,
    maxRetries: row.max_retries as number,
    jobId: row.job_id as string | null,
    lastError: row.last_error as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
