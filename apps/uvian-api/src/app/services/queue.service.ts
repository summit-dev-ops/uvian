import { Queue } from 'bullmq';
import { redisConnection } from '../clients/redis';

export class QueueService {
  private queues: Map<string, Queue> = new Map();

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: redisConnection,
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  async addJob(queueName: string, jobName: string, data: any) {
    const queue = this.getQueue(queueName);
    return await queue.add(jobName, data);
  }
}

export const queueService = new QueueService();
