import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const ScheduleEvents = {
  SCHEDULE_CREATED: `${prefix}.schedule.schedule_created`,
  SCHEDULE_UPDATED: `${prefix}.schedule.schedule_updated`,
  SCHEDULE_CANCELLED: `${prefix}.schedule.schedule_cancelled`,
  SCHEDULE_FIRED: `${prefix}.schedule.schedule_fired`,
  SCHEDULE_COMPLETED: `${prefix}.schedule.schedule_completed`,
  SCHEDULE_FAILED: `${prefix}.schedule.schedule_failed`,
} as const;

export type ScheduleEventType =
  (typeof ScheduleEvents)[keyof typeof ScheduleEvents];

export interface ScheduleCreatedData {
  scheduleId: string;
  type: 'one_time' | 'recurring';
  cronExpression?: string;
  subscriberIds: string[];
  createdBy: string;
}

export interface ScheduleUpdatedData {
  scheduleId: string;
  updatedBy: string;
}

export interface ScheduleCancelledData {
  scheduleId: string;
  cancelledBy: string;
}

export interface ScheduleFiredData {
  scheduleId: string;
  type: 'one_time' | 'recurring';
  eventData: Record<string, unknown>;
  firedAt: string;
}

export interface ScheduleCompletedData {
  scheduleId: string;
  completedAt: string;
}

export interface ScheduleFailedData {
  scheduleId: string;
  error: string;
  retryCount: number;
}

export type ScheduleEventData =
  | ScheduleCreatedData
  | ScheduleUpdatedData
  | ScheduleCancelledData
  | ScheduleFiredData
  | ScheduleCompletedData
  | ScheduleFailedData;
