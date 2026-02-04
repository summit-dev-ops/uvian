import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { queueService } from '../services/queue.service';
import { supabase } from '../services/supabase.service';

export default async function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  // New endpoint to submit jobs (Mocked Supabase Flow)
  fastify.post('/', async (request, reply) => {
    // 1. Validate payload (In real app, this matches DB schema)
    const payload = request.body as any;

    // 2. Real DB Insertion
    const jobId = require('crypto').randomUUID();
    const { error } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        type: payload.type,
        status: 'queued',
        input: payload.input || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }

    console.log(`[API] Real DB Insert: Job ID ${jobId}, Type: ${payload.type}`);

    // 3. Enqueue Job ID
    // The worker will fetch the details from the DB
    await queueService.addJob('main-queue', payload.type || 'generic-job', {
      jobId: jobId,
    });

    return { jobId: jobId, status: 'queued' };
  });
}
