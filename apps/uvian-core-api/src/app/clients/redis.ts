import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT
  ? Number(process.env.REDIS_PORT)
  : 6379;
const redisFamily = process.env.REDIS_FAMILY
  ? Number(process.env.REDIS_FAMILY)
  : 0;

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  family: redisFamily,
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
  console.log('Redis connected');
});
