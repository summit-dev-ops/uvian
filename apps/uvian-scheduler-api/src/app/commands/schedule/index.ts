import {
  ServiceClients,
  CreateScheduleInput,
  Schedule,
} from '../../services/schedule/types';
import { createScheduleService } from '../../services/schedule';
import { subscriptionService } from '../../services/factory';
import type { CommandContext } from '../types';

const scheduleService = createScheduleService({});

async function createSubscriptions(
  clients: ServiceClients,
  scheduleId: string,
  subscriberIds: string[],
): Promise<void> {
  const subService = subscriptionService.admin(clients);

  const existingSubs = await subService.getSubscriptionsByResource(
    'uvian.schedule',
    scheduleId,
  );

  const existingUserIds = new Set(existingSubs.map((s: any) => s.user_id));
  const newSubscriberIds = subscriberIds.filter(
    (uid) => !existingUserIds.has(uid),
  );

  if (newSubscriberIds.length === 0) return;

  const scopedService = subscriptionService.scoped(clients);

  for (const userId of newSubscriberIds) {
    await scopedService.activateSubscription(
      userId,
      'uvian.schedule',
      scheduleId,
    );
  }
}

export interface CreateScheduleCommandInput extends CreateScheduleInput {
  userId: string;
  subscriberIds: string[];
}

export interface CreateScheduleCommandOutput {
  schedule: Schedule;
}

export async function createSchedule(
  clients: ServiceClients,
  input: CreateScheduleCommandInput,
  context?: CommandContext,
): Promise<CreateScheduleCommandOutput> {
  const { userId, subscriberIds, ...scheduleInput } = input;

  const schedule = await scheduleService
    .scoped(clients)
    .createSchedule(userId, scheduleInput);

  if (subscriberIds?.length > 0) {
    await createSubscriptions(clients, schedule.id, subscriberIds);
  }

  if (context?.eventEmitter) {
    context.eventEmitter.emitScheduleCreated(
      {
        scheduleId: schedule.id,
        type: schedule.type,
        cronExpression: schedule.cronExpression || undefined,
        subscriberIds: subscriberIds || [],
        createdBy: userId,
      },
      userId,
    );
  }

  return { schedule };
}

export interface UpdateScheduleCommandInput {
  userId: string;
  scheduleId: string;
  start?: string;
  end?: string;
  cronExpression?: string;
  eventData?: Record<string, unknown>;
}

export interface UpdateScheduleCommandOutput {
  schedule: Schedule;
}

export async function updateSchedule(
  clients: ServiceClients,
  input: UpdateScheduleCommandInput,
  context?: CommandContext,
): Promise<UpdateScheduleCommandOutput> {
  const { userId, scheduleId, ...updateInput } = input;

  const schedule = await scheduleService
    .scoped(clients)
    .updateSchedule(userId, scheduleId, updateInput);

  if (context?.eventEmitter) {
    context.eventEmitter.emitScheduleUpdated(
      {
        scheduleId: schedule.id,
        updatedBy: userId,
      },
      userId,
    );
  }

  return { schedule };
}

export interface CancelScheduleCommandInput {
  userId: string;
  scheduleId: string;
}

export interface CancelScheduleCommandOutput {
  schedule: Schedule;
}

export async function cancelSchedule(
  clients: ServiceClients,
  input: CancelScheduleCommandInput,
  context?: CommandContext,
): Promise<CancelScheduleCommandOutput> {
  const { userId, scheduleId } = input;

  const schedule = await scheduleService
    .scoped(clients)
    .cancelSchedule(userId, scheduleId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitScheduleCancelled(
      {
        scheduleId: schedule.id,
        cancelledBy: userId,
      },
      userId,
    );
  }

  return { schedule };
}

export interface PauseScheduleCommandInput {
  userId: string;
  scheduleId: string;
}

export interface PauseScheduleCommandOutput {
  schedule: Schedule;
}

export async function pauseSchedule(
  clients: ServiceClients,
  input: PauseScheduleCommandInput,
  context?: CommandContext,
): Promise<PauseScheduleCommandOutput> {
  const { userId, scheduleId } = input;

  const schedule = await scheduleService
    .scoped(clients)
    .pauseSchedule(userId, scheduleId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitScheduleUpdated(
      {
        scheduleId: schedule.id,
        updatedBy: userId,
      },
      userId,
    );
  }

  return { schedule };
}

export interface ResumeScheduleCommandInput {
  userId: string;
  scheduleId: string;
}

export interface ResumeScheduleCommandOutput {
  schedule: Schedule;
}

export async function resumeSchedule(
  clients: ServiceClients,
  input: ResumeScheduleCommandInput,
  context?: CommandContext,
): Promise<ResumeScheduleCommandOutput> {
  const { userId, scheduleId } = input;

  const schedule = await scheduleService
    .scoped(clients)
    .resumeSchedule(userId, scheduleId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitScheduleUpdated(
      {
        scheduleId: schedule.id,
        updatedBy: userId,
      },
      userId,
    );
  }

  return { schedule };
}
