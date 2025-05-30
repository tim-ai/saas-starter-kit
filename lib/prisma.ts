import { PrismaClient } from '@prisma/client';
import { redis } from './redis';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const CACHE_ENABLED = process.env.REDIS_CACHE_ENABLED === 'true';
const CACHE_MODELS = ['Team', 'User', 'Service']; // Models to cache

// Create extended Prisma client
const prismaInstance = global.prisma || new PrismaClient();

// Add caching middleware
prismaInstance.$use(async (params, next) => {
  // Bypass cache if not enabled or not cacheable model
  if (!CACHE_ENABLED || !CACHE_MODELS.includes(params.model)) {
    return next(params);
  }

  // Generate cache key
  const cacheKey = `prisma:${params.model}:${params.action}:${JSON.stringify(params.args)}`;

  // Handle read operations (cache get)
  if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
    try {
      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
      
      // Execute query if not cached
      const result = await next(params);
      await redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Cache read error:', error);
      return next(params);
    }
  }
  
  // Handle write operations (cache invalidation)
  if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
    const result = await next(params);
    
    // Invalidate related cache
    const pattern = `prisma:${params.model}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
    
    return result;
  }
  
  return next(params);
});

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
