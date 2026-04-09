import fp from 'fastify-plugin';
import cron from 'node-cron';
import { adminSupabase } from '../clients/supabase.client';
import { queueService } from '../services/factory';
import { redisConnection } from '../clients/redis';
import { createCloudEvent, ScheduleEvents } from '@org/uvian-events';
import { scheduleService } from '../services/factory';

const VALID_INTERVALS = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];

export const SYNC_INTERVAL_MINUTES = (() => {
  const raw = process.env.SCHEDULER_SYNC_INTERVAL_MINUTES || 15;
  const value = raw ? Number(raw) : 15;
  if (!Number.isInteger(value) || !VALID_INTERVALS.includes(value)) {
    throw new Error(
      `SCHEDULER_SYNC_INTERVAL_MINUTES must be a divisor of 60 (${VALID_INTERVALS.join(
        ', ',
      )}), got: ${raw}`,
    );
  }
  return value;
})();

const LOCK_KEY = 'scheduler:cron:lock';
const LOCK_TTL = 120;

async function acquireLock(): Promise<boolean> {
  const result = await redisConnection.set(
    LOCK_KEY,
    Date.now().toString(),
    'EX',
    LOCK_TTL,
    'NX',
  );
  return result === 'OK';
}

async function releaseLock(): Promise<void> {
  await redisConnection.del(LOCK_KEY);
}

export async function fireSchedule(
  scheduleId: string,
  userId: string,
  type: 'one_time' | 'recurring',
  eventData: Record<string, unknown>,
  fireTime: Date,
): Promise<{ status: string; fireAt?: string }> {
  const fireTimestamp = fireTime.getTime();

  const event = createCloudEvent({
    type: ScheduleEvents.SCHEDULE_FIRED,
    source: `/schedules/${scheduleId}`,
    subject: userId,
    data: {
      scheduleId,
      type,
      eventData,
      firedAt: fireTime.toISOString(),
    },
  });

  await queueService.addJobAt('uvian-events', 'event', event, fireTimestamp);

  // Update last_executed_at when schedule is fired
  await adminSupabase
    .schema('core_scheduler')
    .from('schedules')
    .update({
      last_executed_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);

  const clients = {
    adminClient: adminSupabase,
    userClient: adminSupabase,
  };
  const scopedService = scheduleService.scoped(clients);

  if (type === 'one_time') {
    await scopedService.markCompleted(scheduleId);
  } else {
    const fullSchedule = await scopedService.getSchedule(userId, scheduleId);
    const nextRunAt = scopedService.computeNextRunAt(fullSchedule);
    if (nextRunAt) {
      await adminSupabase
        .schema('core_scheduler')
        .from('schedules')
        .update({
          next_run_at: nextRunAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);
    } else {
      await adminSupabase
        .schema('core_scheduler')
        .from('schedules')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);
    }
  }

  return { status: 'queued', fireAt: fireTime.toISOString() };
}

async function syncSchedules(): Promise<{
  processed: number;
  results: unknown[];
}> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + SYNC_INTERVAL_MINUTES * 60 * 1000);

  const { data: dueSchedules, error: queryError } = await adminSupabase
    .schema('core_scheduler')
    .from('schedules')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', windowEnd.toISOString());

  if (queryError) {
    console.error('Failed to query due schedules:', queryError);
    return { processed: 0, results: [] };
  }

  if (!dueSchedules || dueSchedules.length === 0) {
    return { processed: 0, results: [] };
  }

  const results = [];

  for (const row of dueSchedules) {
    try {
      const schedule = mapRow(row);
      const fireTime = new Date(schedule.nextRunAt);

      const { data: freshCheck, error: freshError } = await adminSupabase
        .schema('core_scheduler')
        .from('schedules')
        .select('status')
        .eq('id', schedule.id)
        .single();

      if (freshError || freshCheck?.status !== 'active') {
        results.push({
          scheduleId: schedule.id,
          status: 'skipped',
          reason: 'no longer active',
        });
        continue;
      }

      const result = await fireSchedule(
        schedule.id,
        schedule.userId,
        schedule.type,
        schedule.eventData,
        fireTime,
      );

      results.push({ scheduleId: schedule.id, ...result });
    } catch (err) {
      console.error('Failed to process schedule:', row.id, err);
      results.push({
        scheduleId: row.id,
        status: 'error',
        error: String(err),
      });
    }
  }

  return { processed: results.length, results };
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as 'one_time' | 'recurring',
    nextRunAt: row.next_run_at as string,
    status: row.status as string,
    eventData: (row.event_data as Record<string, unknown>) || {},
  };
}

export default fp(async (fastify) => {
  let isRunning = false;

  cron.schedule(`*/${SYNC_INTERVAL_MINUTES} * * * *`, async () => {
    if (isRunning) {
      console.log('[Cron] Previous sync still running, skipping...');
      return;
    }

    const lockAcquired = await acquireLock();
    if (!lockAcquired) {
      console.log(
        '[Cron] Lock not acquired, another instance may be handling it',
      );
      return;
    }

    isRunning = true;
    console.log('[Cron] Starting schedule sync...');

    try {
      const result = await syncSchedules();
      console.log(
        `[Cron] Sync complete: ${result.processed} schedules processed`,
      );
    } catch (error) {
      console.error('[Cron] Sync error:', error);
    } finally {
      isRunning = false;
      await releaseLock();
    }
  });

  console.log(
    `[Cron] Scheduler initialized with ${SYNC_INTERVAL_MINUTES}-minute interval`,
  );

  fastify.decorate('runCronSync', async () => {
    if (isRunning) {
      return { status: 'already_running' };
    }

    const lockAcquired = await acquireLock();
    if (!lockAcquired) {
      return { status: 'lock_not_acquired' };
    }

    isRunning = true;
    try {
      return await syncSchedules();
    } finally {
      isRunning = false;
      await releaseLock();
    }
  });

  fastify.get('/api/cron/status', async () => {
    return {
      status: 'running',
      schedule: `*/${SYNC_INTERVAL_MINUTES} * * * *`,
      isProcessing: isRunning,
    };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    runCronSync: () => Promise<
      { processed: number; results: unknown[] } | { status: string }
    >;
  }
}
