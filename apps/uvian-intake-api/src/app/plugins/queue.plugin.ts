import { Queue, Job } from 'bullmq';
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyBaseLogger } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    queueService: QueueService;
  }
}

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD || undefined,
};

export class QueueService {
  private queues: Map<string, Queue> = new Map();

  getQueue(name: string, log: FastifyBaseLogger): Queue {
    if (!this.queues.has(name)) {
      log.info(
        {
          queueName: name,
          redisHost: redisConnection.host,
          redisPort: redisConnection.port,
        },
        'Creating new BullMQ queue'
      );

      const queue = new Queue(name, {
        connection: redisConnection as any,
      });

      queue.on('error', (err: Error) => {
        log.error({ err, queueName: name }, 'BullMQ queue error');
      });

      (queue as any).on('waiting', (job: Job) => {
        log.info({ jobId: job.id, queueName: name }, 'Job waiting in queue');
      });

      (queue as any).on('active', (job: Job) => {
        log.info({ jobId: job.id, queueName: name }, 'Job became active');
      });

      (queue as any).on('completed', (job: Job) => {
        log.info({ jobId: job.id, queueName: name }, 'Job completed');
      });

      (queue as any).on('failed', (job: Job | undefined, err: Error) => {
        log.error({ jobId: job?.id, err, queueName: name }, 'Job failed');
      });

      this.queues.set(name, queue);
      log.info({ queueName: name }, 'BullMQ queue created successfully');
    }
    return this.queues.get(name)!;
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: unknown,
    log: FastifyBaseLogger
  ) {
    log.info({ queueName, jobName }, 'Adding job to queue');
    const queue = this.getQueue(queueName, log);
    const job = await queue.add(jobName, data);
    log.info({ jobId: job.id, queueName, jobName }, 'Job added successfully');
    return job;
  }
}

const queueService = new QueueService();

async function queuePlugin(fastify: FastifyInstance) {
  fastify.log.info(
    { redisHost: redisConnection.host, redisPort: redisConnection.port },
    'Initializing queue plugin'
  );
  fastify.decorate('queueService', queueService);
  fastify.log.info('Queue plugin initialized');
}

export default fp(queuePlugin);
