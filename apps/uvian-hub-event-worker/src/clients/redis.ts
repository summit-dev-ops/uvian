import Redis from 'ioredis';

const connectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  family: Number(process.env.REDIS_FAMILY) || 0,
};

export const redisConnection = new Redis(connectionConfig);

redisConnection.on('connect', () => {
  console.log(
    `[Redis] Connected to ${connectionConfig.host}:${connectionConfig.port}`
  );
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});
