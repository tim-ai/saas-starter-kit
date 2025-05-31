import { redis } from './redis';
import { prisma } from './prisma';

export async function getUsage(entityId: string, entityType: 'user' | 'team', resourceType: string): Promise<number> {
  // First try to get from Redis cache
  const key = `usage:${entityType}:${entityId}:${resourceType}`;
  const cachedValue = await redis.get<number>(key);
  
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  // If not in cache, get from database
  const usageRecord = await prisma.resourceUsage.findUnique({
    where: {
      entityId_entityType_resourceType: {
        entityId,
        entityType,
        resourceType
      }
    }
  });
  
  return usageRecord?.usage ?? 0;
}

export async function trackUsage(
  entityId: string,
  entityType: 'user' | 'team',
  resourceType: string,
  incrementBy: number = 1
): Promise<number> {
  const key = `usage:${entityType}:${entityId}:${resourceType}`;
  
  // Update Redis cache
  const newRedisUsage = await redis.increment(key, incrementBy);
  
  // // Update database
  // await prisma.resourceUsage.upsert({
  //   where: {
  //     entityId_entityType_resourceType: {
  //       entityId,
  //       entityType,
  //       resourceType
  //     }
  //   },
  //   create: {
  //     entityId,
  //     entityType,
  //     resourceType,
  //     usage: newRedisUsage
  //   },
  //   update: {
  //     usage: newRedisUsage
  //   }
  // });
  
  return newRedisUsage;
}

export async function resetUsage(
  entityId: string,
  entityType: 'user' | 'team',
  resourceType: string
): Promise<void> {
  const key = `usage:${entityType}:${entityId}:${resourceType}`;
  
  // Clear Redis cache
  await redis.del(key);
  
  // Clear database record
  await prisma.resourceUsage.delete({
    where: {
      entityId_entityType_resourceType: {
        entityId,
        entityType,
        resourceType
      }
    }
  }).catch(() => {}); // Ignore if record doesn't exist
}

export async function checkUsageLimit(
  entityId: string,
  entityType: 'user' | 'team',
  resourceType: string
): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit?: number
}> {
  const entity = entityType === 'user'
    ? await prisma.user.findUnique({
        where: { id: entityId },
        include: { tier: true }
      })
    : await prisma.team.findUnique({
        where: { id: entityId },
        include: { tier: true }
      });
  let tier = entity?.tier;
  // Handle case where entity doesn't exist or doesn't have a tier
  if (!entity || !('tier' in entity) || !entity.tier) {
    tier = await prisma.tier.findFirst({
      where: {
        name: 'basic-tier' // Default tier if entity doesn't have one
      }
    });
  } 

  const currentUsage = await getUsage(entityId, entityType, resourceType);
  
  // Check if limits JSON has specific limit for this resource type
  let limit: number | undefined;
  if (tier?.limits) {
    try {
      const limits = JSON.parse(JSON.stringify(tier.limits));
      limit = limits[resourceType];
    } catch (e) {
      console.error('Error parsing tier limits', e);
    }
  }
  
  // Fallback to maxApiCalls if no specific limit found
  if (limit === undefined) {
    limit = tier?.maxApiCalls;
  }
  
  if (limit === undefined || limit === null) {
    return { allowed: true, currentUsage, limit: undefined };
  }

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit
  };
}