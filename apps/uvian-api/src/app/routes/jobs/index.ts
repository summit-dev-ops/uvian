import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { queueService } from '../../services/queue.service';
import Redis from 'ioredis';

// SSE helper to set appropriate headers
function setSSEHeaders(reply: any) {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
}

export default async function (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  // New endpoint to submit RunPod jobs
  fastify.post('/', async (request, reply) => {
    const payload = request.body as {
      type: 'chat' | 'completion' | 'embedding';
      prompt?: string;
      messages?: { role: string; content: string }[];
      model?: string;
      options?: Record<string, any>;
    };

    // Basic validation – ensure required fields per type
    if (!payload.type) {
      reply.code(400);
      return { error: 'Missing job type' };
    }

    const job = await queueService.addJob('main-queue', 'runpod-job', payload);
    return { jobId: job.id, status: 'queued' };
  });

  // Streaming endpoint – SSE
  fastify.get('/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };
    setSSEHeaders(reply);

    const channel = `job:${id}:responses`;
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    const handleMessage = (msg: string) => {
      const data = JSON.parse(msg);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      if (data.finished) {
        subscriber.quit();
      }
    };

    subscriber.subscribe(channel, (err, count) => {
      if (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Subscription failed' });
      }
    });
    subscriber.on('message', (chan, message) => {
      if (chan === channel) handleMessage(message);
    });

    // Cleanup on client disconnect
    request.raw.on('close', () => {
      subscriber.quit();
    });
  });
}
