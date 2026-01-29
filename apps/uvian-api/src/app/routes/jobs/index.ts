import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { queueService } from '../../services/queue.service';

export default async function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.post('/test', async (request, reply) => {
    const { message } = request.body as { message: string };
    const job = await queueService.addJob('main-queue', 'test-job', {
      message: message || 'Hello from uvian-api!',
      timestamp: new Date().toISOString(),
    });

    return { jobId: job.id, status: 'queued' };
  });
}
