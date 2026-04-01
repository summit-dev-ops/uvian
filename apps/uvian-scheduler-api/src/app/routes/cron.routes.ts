import { FastifyInstance } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { queueService } from '../services/factory';

export default async function cronRoutes(fastify: FastifyInstance) {
  fastify.post('/api/cron/sync', async (_, reply) => {
    try {
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
        return reply.code(500).send({ error: 'Failed to query schedules' });
      }

      if (!pendingSchedules || pendingSchedules.length === 0) {
        return { processed: 0, message: 'No pending schedules in window' };
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

          await queueService.addJob('main-queue', 'agent', {
            jobId: jobId,
          });

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
    } catch (error) {
      console.error('Cron sync error:', error);
      return reply.code(500).send({ error: 'Cron sync failed' });
    }
  });
}
