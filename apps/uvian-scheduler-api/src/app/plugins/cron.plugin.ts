import fp from 'fastify-plugin';
import cron from 'node-cron';
import { adminSupabase } from '../clients/supabase.client';
import { queueService } from '../services/factory';
import { redisConnection } from '../clients/redis';

const LOCK_KEY = 'scheduler:cron:lock';
const LOCK_TTL = 60;

async function acquireLock(): Promise<boolean> {
  const result = await redisConnection.set(
    LOCK_KEY,
    Date.now().toString(),
    'EX',
    LOCK_TTL,
    'NX'
  );
  return result === 'OK';
}

async function releaseLock(): Promise<void> {
  await redisConnection.del(LOCK_KEY);
}

async function syncSchedules(): Promise<{
  processed: number;
  results: unknown[];
}> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);

  const { data: pendingSchedules, error: queryError } = await adminSupabase
    .schema('core_automation')
    .from('scheduled_tasks')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', windowEnd.toISOString())
    .gte('scheduled_for', now.toISOString());

  if (queryError) {
    console.error('Failed to query pending schedules:', queryError);
    return { processed: 0, results: [] };
  }

  if (!pendingSchedules || pendingSchedules.length === 0) {
    return { processed: 0, results: [] };
  }

  const results = [];

  for (const schedule of pendingSchedules) {
    try {
      const jobId = crypto.randomUUID();

      const { error: jobError } = await adminSupabase
        .schema('core_automation')
        .from('jobs')
        .insert({
          id: jobId,
          type: 'agent',
          status: 'queued',
          agent_id: schedule.agent_id,
          input: {
            inputType: 'event',
            eventType: 'schedule.triggered',
            agentId: schedule.agent_id,
            resource: {
              type: 'schedule',
              id: schedule.id,
              data: {
                scheduleId: schedule.id,
                description: schedule.description,
              },
            },
          },
          input_type: 'scheduled',
        });

      if (jobError) {
        console.error(
          'Failed to create job for schedule:',
          schedule.id,
          jobError
        );
        results.push({
          scheduleId: schedule.id,
          status: 'error',
          error: jobError.message,
        });
        continue;
      }

      await queueService.addJob('main-queue', 'agent', { jobId });

      const { error: updateError } = await adminSupabase
        .schema('core_automation')
        .from('scheduled_tasks')
        .update({
          status: 'queued',
          job_id: jobId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', schedule.id);

      if (updateError) {
        console.error(
          'Failed to update schedule status:',
          schedule.id,
          updateError
        );
      }

      results.push({ scheduleId: schedule.id, status: 'queued', jobId });
    } catch (err) {
      console.error('Failed to process schedule:', schedule.id, err);
      results.push({
        scheduleId: schedule.id,
        status: 'error',
        error: String(err),
      });
    }
  }

  return { processed: results.length, results };
}

export default fp(async (fastify) => {
  let isRunning = false;

  cron.schedule('*/10 * * * *', async () => {
    if (isRunning) {
      console.log('[Cron] Previous sync still running, skipping...');
      return;
    }

    const lockAcquired = await acquireLock();
    if (!lockAcquired) {
      console.log(
        '[Cron] Lock not acquired, another instance may be handling it'
      );
      return;
    }

    isRunning = true;
    console.log('[Cron] Starting schedule sync...');

    try {
      const result = await syncSchedules();
      console.log(
        `[Cron] Sync complete: ${result.processed} schedules processed`
      );
    } catch (error) {
      console.error('[Cron] Sync error:', error);
    } finally {
      isRunning = false;
      await releaseLock();
    }
  });

  console.log('[Cron] Scheduler initialized with 10-minute interval');

  fastify.decorate('runCronSync', async () => {
    if (isRunning) {
      return { status: 'already_running' };
    }

    isRunning = true;
    try {
      return await syncSchedules();
    } finally {
      isRunning = false;
    }
  });

  fastify.get('/api/cron/status', async () => {
    return {
      status: 'running',
      schedule: '*/10 * * * *',
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
