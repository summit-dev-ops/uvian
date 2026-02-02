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
  // New endpoint to submit jobs (Mocked Supabase Flow)
  fastify.post('/', async (request, reply) => {
    // 1. Validate payload (In real app, this matches DB schema)
    const payload = request.body as any;

    // 2. Mock DB Insertion
    // In production: const { data, error } = await supabase.from('jobs').insert({...}).selectSingle();
    const mockJobId = require('crypto').randomUUID();
    console.log(
      `[API] Mocked DB Insert: Job ID ${mockJobId}, Type: ${payload.type}`
    );

    // 3. Enqueue Job ID
    // The worker will fetch the details from the DB (or use its mock fallback)
    await queueService.addJob('main-queue', 'generic-job', {
      jobId: mockJobId,
    });

    return { jobId: mockJobId, status: 'queued' };
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
