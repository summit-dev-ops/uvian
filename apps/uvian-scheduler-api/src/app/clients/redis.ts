import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
};

export const redisConnection = new Redis(redisConfig);

export default redisConnection;
