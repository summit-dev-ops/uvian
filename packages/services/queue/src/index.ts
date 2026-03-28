import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

export interface CreateQueueServiceConfig {
  redisConnection: Redis;
}

export interface QueueService {
  getQueue(name: string): Queue;
  addJob(queueName: string, jobName: string, data: unknown): Promise<Job>;
}

export function createQueueService(
  config: CreateQueueServiceConfig
): QueueService {
  const { redisConnection } = config;
  const queues: Map<string, Queue> = new Map();

  return {
    getQueue(name: string): Queue {
      if (!queues.has(name)) {
        const queue = new Queue(name, {
          connection: redisConnection as any,
        });
        queues.set(name, queue);
      }
      return queues.get(name)!;
    },

    async addJob(
      queueName: string,
      jobName: string,
      data: unknown
    ): Promise<Job> {
      const queue = this.getQueue(queueName);
      return await queue.add(jobName, data);
    },
  };
}
