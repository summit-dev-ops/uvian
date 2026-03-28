import Redis from 'ioredis';

export interface CacheConfig {
  ttl: number;
}

function getCacheKey(
  serviceName: string,
  methodName: string,
  args: unknown[]
): string {
  const argsKey = args.length > 0 ? JSON.stringify(args) : '';
  return `cache:${serviceName}:${methodName}:${argsKey}`;
}

export function withCache<T extends object>(
  service: T,
  redis: Redis,
  config: CacheConfig
): T {
  const serviceName = service.constructor.name;

  const handler: ProxyHandler<T> = {
    get(target, prop) {
      const value = Reflect.get(target, prop);

      if (typeof value !== 'function') {
        return value;
      }

      return async function (...args: unknown[]) {
        const methodName = String(prop);
        const cacheKey = getCacheKey(serviceName, methodName, args);

        try {
          const cached = await redis.get(cacheKey);
          if (cached !== null) {
            return JSON.parse(cached);
          }
        } catch {
          // Redis error - fall through to fetch
        }

        const result = await Reflect.apply(value, target, args);

        try {
          await redis.setex(cacheKey, config.ttl, JSON.stringify(result));
        } catch {
          // Redis error - ignore cache write failure
        }

        return result;
      };
    },
  };

  return new Proxy(service, handler);
}

export function invalidateCache(
  redis: Redis,
  serviceName: string,
  methodName: string,
  args: unknown[]
): Promise<number> {
  const cacheKey = getCacheKey(serviceName, methodName, args);
  return redis.del(cacheKey);
}
