import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
  family: Number(process.env.REDIS_FAMILY) || 0,
};

export const redisConnection = new Redis(redisConfig);

export default redisConnection;
