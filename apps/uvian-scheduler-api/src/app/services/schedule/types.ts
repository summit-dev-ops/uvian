import { adminSupabase, createUserClient } from '../../clients/supabase.client';

export interface ServiceClients {
  adminClient: typeof adminSupabase;
  userClient: ReturnType<typeof createUserClient>;
}

export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type ScheduleType = 'one_time' | 'recurring';

export interface Schedule {
  id: string;
  userId: string;
  type: ScheduleType;
  start: string | null;
  end: string | null;
  cronExpression: string | null;
  nextRunAt: string;
  status: ScheduleStatus;
  eventData: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  type?: ScheduleType;
  start?: string;
  end?: string;
  cronExpression?: string;
  eventData?: Record<string, unknown>;
  subscriberIds?: string[];
}

export interface UpdateScheduleInput {
  start?: string;
  end?: string;
  cronExpression?: string;
  eventData?: Record<string, unknown>;
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
  updateSchedule(
    userId: string,
    id: string,
    input: UpdateScheduleInput
  ): Promise<Schedule>;
  listSchedules(
    userId: string,
    filters?: ListSchedulesFilters
  ): Promise<ListSchedulesResult>;
  getSchedule(userId: string, id: string): Promise<Schedule>;
  cancelSchedule(userId: string, id: string): Promise<Schedule>;
  pauseSchedule(userId: string, id: string): Promise<Schedule>;
  resumeSchedule(userId: string, id: string): Promise<Schedule>;
  markCompleted(id: string): Promise<Schedule>;
  markFailed(id: string, error: string): Promise<Schedule>;
  computeNextRunAt(schedule: Schedule): string | null;
}
