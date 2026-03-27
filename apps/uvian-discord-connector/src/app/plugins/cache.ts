import fp from 'fastify-plugin';
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
};

export const redisConnection = new Redis(redisConfig);

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  getRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean>;
}

class RedisCacheService implements CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redisConnection.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redisConnection.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redisConnection.del(key);
  }

  async getRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    const count = await redisConnection.incr(key);
    if (count === 1) {
      await redisConnection.expire(key, windowSeconds);
    }
    return count <= limit;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
  }
}

export default fp(async (fastify) => {
  const cache = new RedisCacheService();
  fastify.decorate('cache', cache);

  fastify.addHook('onClose', async () => {
    await redisConnection.quit();
  });
});
