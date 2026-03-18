import { Worker, Job } from 'bullmq';
import { CloudEvent } from '@org/uvian-events';
import { eventRouter } from './services/event-router.service';
import './clients/redis';

const QUEUE_NAME = 'uvian-events';

const connectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
};

async function processEvent(job: Job) {
  console.log('========================================');
  console.log(`[${new Date().toISOString()}] Event Received`);
  console.log(`Job ID: ${job.id}`);
  console.log(`Queue: ${QUEUE_NAME}`);
  console.log('----------------------------------------');
  console.log(JSON.stringify(job.data, null, 2));
  console.log('========================================');

  const event = job.data as CloudEvent;

  try {
    await eventRouter.processEvent(event);
    console.log(`[${new Date().toISOString()}] Event processed successfully`);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error processing event:`,
      error
    );
  }
}

const worker = new Worker(QUEUE_NAME, processEvent, {
  connection: connectionConfig,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

worker.on('completed', (job) => {
  console.log(`[${new Date().toISOString()}] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(
    `[${new Date().toISOString()}] Job ${job?.id} failed:`,
    err.message
  );
});

worker.on('closed', () => {
  console.log(`[${new Date().toISOString()}] Worker disconnected`);
});

console.log(`[${new Date().toISOString()}] Event worker started`);
console.log(`Listening on queue: ${QUEUE_NAME}`);
console.log(`Redis: ${connectionConfig.host}:${connectionConfig.port}`);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
