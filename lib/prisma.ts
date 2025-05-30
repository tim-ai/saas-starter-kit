import { PrismaClient, Prisma } from '@prisma/client';
import { redis } from './redis';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createExtendedPrismaClient> | undefined;
}

const CACHE_TTL = 300; // 5 minutes
const CACHE_ENABLED = process.env.REDIS_CACHE_ENABLED === 'true';
const CACHE_MODELS = ['Team', 'User', 'Service']; // Models to cache

// Define caching extension with proper typing
const cachingExtension = Prisma.defineExtension({
  name: 'cachingExtension',
  query: {
    $allModels: {
      async findUnique({ args, model, query }) {
        if (!CACHE_ENABLED || !CACHE_MODELS.includes(model)) {
          return query(args);
        }
        const cacheKey = `prisma:${model}:findUnique:${JSON.stringify(args)}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await query(args);
        await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
        return result;
      },
      async findFirst({ args, model, query }) {
        if (!CACHE_ENABLED || !CACHE_MODELS.includes(model)) {
          return query(args);
        }
        const cacheKey = `prisma:${model}:findFirst:${JSON.stringify(args)}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await query(args);
        await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
        return result;
      },
      async findMany({ args, model, query }) {
        if (!CACHE_ENABLED || !CACHE_MODELS.includes(model)) {
          return query(args);
        }
        const cacheKey = `prisma:${model}:findMany:${JSON.stringify(args)}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await query(args);
        await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
        return result;
      },
      async count({ args, model, query }) {
        if (!CACHE_ENABLED || !CACHE_MODELS.includes(model)) {
          return query(args);
        }
        const cacheKey = `prisma:${model}:count:${JSON.stringify(args)}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await query(args);
        await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
        return result;
      }
    }
  },
  result: {
    $allModels: {
      create: {
        compute: async function (this: { model: string }, data) {
          const pattern = `prisma:${this.model}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) await redis.delKeys(keys);
          return data;
        }
      },
      update: {
        compute: async function (this: { model: string }, data) {
          const pattern = `prisma:${this.model}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) await redis.delKeys(keys);
          return data;
        }
      },
      delete: {
        compute: async function (this: { model: string }, data) {
          const pattern = `prisma:${this.model}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) await redis.delKeys(keys);
          return data;
        }
      },
      upsert: {
        compute: async function (this: { model: string }, data) {
          const pattern = `prisma:${this.model}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) await redis.delKeys(keys);
          return data;
        }
      }
    }
  }
});

function createExtendedPrismaClient() {
  return new PrismaClient().$extends(cachingExtension);
}

const prismaInstance = global.prisma || createExtendedPrismaClient();

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaInstance;
}
