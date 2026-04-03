import { randomUUID } from 'crypto';
import cronParser from 'cron-parser';
import {
  ServiceClients,
  ScheduleScopedService,
  CreateScheduleInput,
  UpdateScheduleInput,
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
      .schema('core_scheduler')
      .from('schedules')
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

      const type = input.type || 'one_time';

      let nextRunAt: string;
      if (type === 'one_time') {
        if (!input.start) {
          throw new Error('start is required for one_time schedules');
        }
        nextRunAt = input.start;
      } else {
        if (!input.cronExpression) {
          throw new Error('cronExpression is required for recurring schedules');
        }
        try {
          cronParser.parse(input.cronExpression);
        } catch {
          throw new Error(`Invalid cron expression: ${input.cronExpression}`);
        }
        nextRunAt = computeNextRunAtFromCron(input.cronExpression, input.start);
      }

      const { data: schedule, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .insert({
          id: scheduleId,
          user_id: userId,
          type,
          start: input.start || null,
          end: input.end || null,
          cron_expression: input.cronExpression || null,
          next_run_at: nextRunAt,
          status: 'active',
          event_data: input.eventData || {},
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

    async updateSchedule(
      userId: string,
      id: string,
      input: UpdateScheduleInput
    ): Promise<Schedule> {
      const existing = await getScheduleInternal(id);
      if (existing.userId !== userId) {
        throw new Error('Not authorized to update this schedule');
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.start !== undefined) updates.start = input.start;
      if (input.end !== undefined) updates.end = input.end;
      if (input.cronExpression !== undefined) {
        try {
          cronParser.parse(input.cronExpression);
        } catch {
          throw new Error(`Invalid cron expression: ${input.cronExpression}`);
        }
        updates.cron_expression = input.cronExpression;
        if (existing.type === 'recurring') {
          updates.next_run_at = computeNextRunAtFromCron(
            input.cronExpression,
            input.start || existing.start || undefined
          );
        }
      }
      if (input.eventData !== undefined) updates.event_data = input.eventData;

      const { data: updated, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) throw new Error('Failed to update schedule');
      return mapRow(updated);
    },

    async listSchedules(
      userId: string,
      filters?: ListSchedulesFilters
    ): Promise<ListSchedulesResult> {
      let query = clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('next_run_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.cursor) {
        query = query.lt('next_run_at', filters.cursor);
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

      if (schedule.status !== 'active' && schedule.status !== 'paused') {
        throw new Error('Cannot cancel schedule that is not active or paused');
      }

      const { data: updated, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) throw new Error('Failed to cancel schedule');
      return mapRow(updated);
    },

    async pauseSchedule(userId: string, id: string): Promise<Schedule> {
      const schedule = await getScheduleInternal(id);
      if (schedule.userId !== userId) {
        throw new Error('Not authorized to pause this schedule');
      }

      if (schedule.status !== 'active') {
        throw new Error('Can only pause active schedules');
      }

      const { data: updated, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) throw new Error('Failed to pause schedule');
      return mapRow(updated);
    },

    async resumeSchedule(userId: string, id: string): Promise<Schedule> {
      const schedule = await getScheduleInternal(id);
      if (schedule.userId !== userId) {
        throw new Error('Not authorized to resume this schedule');
      }

      if (schedule.status !== 'paused') {
        throw new Error('Can only resume paused schedules');
      }

      let nextRunAt = schedule.nextRunAt;
      if (schedule.type === 'recurring' && schedule.cronExpression) {
        nextRunAt = computeNextRunAtFromCron(
          schedule.cronExpression,
          new Date().toISOString()
        );
      }

      const { data: updated, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .update({
          status: 'active',
          next_run_at: nextRunAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) throw new Error('Failed to resume schedule');
      return mapRow(updated);
    },

    async markCompleted(id: string): Promise<Schedule> {
      const { data: updated, error } = await clients.adminClient
        .schema('core_scheduler')
        .from('schedules')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'active')
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
          .schema('core_scheduler')
          .from('schedules')
          .update({
            status: 'cancelled',
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
        .schema('core_scheduler')
        .from('schedules')
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

    computeNextRunAt(schedule: Schedule): string | null {
      if (schedule.type === 'one_time') return null;
      if (!schedule.cronExpression) return null;
      return computeNextRunAtFromCron(
        schedule.cronExpression,
        schedule.start || undefined
      );
    },
  };
}

function computeNextRunAtFromCron(
  cronExpression: string,
  afterIso?: string
): string {
  const interval = cronParser.parse(cronExpression, {
    currentDate: afterIso ? new Date(afterIso) : new Date(),
  });

  const next = interval.next();
  if (!next)
    throw new Error(
      `Could not compute next run time for cron: ${cronExpression}`
    );
  const iso = next.toISOString();
  if (!iso)
    throw new Error(
      `Could not compute next run time for cron: ${cronExpression}`
    );
  return iso;
}

function mapRow(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as 'one_time' | 'recurring',
    start: (row.start as string) || null,
    end: (row.end as string) || null,
    cronExpression: row.cron_expression as string | null,
    nextRunAt: row.next_run_at as string,
    status: row.status as ScheduleStatus,
    eventData: (row.event_data as Record<string, unknown>) || {},
    retryCount: row.retry_count as number,
    maxRetries: row.max_retries as number,
    lastError: row.last_error as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
