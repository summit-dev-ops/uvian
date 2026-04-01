import { adminSupabase, createUserClient } from '../../clients/supabase.client';

export interface ServiceClients {
  adminClient: typeof adminSupabase;
  userClient: ReturnType<typeof createUserClient>;
}

export type ScheduleStatus =
  | 'pending'
  | 'queued'
  | 'completed'
  | 'cancelled'
  | 'failed';
export type ScheduleType = 'one_time' | 'recurring';

export interface Schedule {
  id: string;
  userId: string;
  agentId: string;
  description: string;
  scheduleType: ScheduleType;
  scheduledFor: string;
  cronExpression: string | null;
  status: ScheduleStatus;
  retryCount: number;
  maxRetries: number;
  jobId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  agentId: string;
  description: string;
  scheduledFor: string;
  scheduleType?: ScheduleType;
  cronExpression?: string;
}

export interface ListSchedulesFilters {
  status?: ScheduleStatus;
  limit?: number;
  cursor?: string;
}

export interface ListSchedulesResult {
  schedules: Schedule[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ScheduleScopedService {
  createSchedule(userId: string, input: CreateScheduleInput): Promise<Schedule>;
  listSchedules(
    userId: string,
    filters?: ListSchedulesFilters
  ): Promise<ListSchedulesResult>;
  getSchedule(userId: string, id: string): Promise<Schedule>;
  cancelSchedule(userId: string, id: string): Promise<Schedule>;
  markCompleted(id: string): Promise<Schedule>;
  markFailed(id: string, error: string): Promise<Schedule>;
}
