import { redis } from './redis';
import { prisma } from './prisma';

export async function getUsage(entityId: string, entityType: 'user' | 'team' | 'system', resourceType: string): Promise<number> {
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
  entityType: 'user' | 'team' | 'system',
  resourceType: string,
  incrementBy: number = 1
): Promise<number> {
  const key = `usage:${entityType}:${entityId}:${resourceType}`;
  
  // Ensure Redis connection
  await redis.connect();
  
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
  entityType: 'user' | 'team' | 'system',
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

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit?: number;
}

export async function checkUsageLimit(
  entityId: string,
  entityType: 'user' | 'team' | 'system',
  resourceType: string
): Promise<UsageCheckResult> {
  // System entities have no usage limits
  if (entityType === 'system') {
    return {
      allowed: true,
      currentUsage: 0,
      limit: undefined
    };
  }

  // retrieve with relation of subscriptions.tier for user models
  // and tier for team models

  const entity = entityType === 'user'
    ? await prisma.user.findUnique({
        where: { id: entityId },
        include: { subscriptions: { include: { tier: true } }}
      })
    : await prisma.team.findUnique({
        where: { id: entityId },
        include: { subscriptions: { include: { tier: true } }}
      });
  let tier = entity?.subscriptions[0]?.tier || null;
  // Handle case where entity doesn't exist or doesn't have a tier
  if (!entity || !('subscriptions' in entity) || !entity.subscriptions[0]?.tier) {
    tier = await prisma.tier.findFirst({
      where: {
        id: 'basic-tier' 
      }
    });
  }

  const currentUsage = await getUsage(entityId, entityType, resourceType);
  
  // Check if limits JSON has specific limit for this resource type
  let limit: number | undefined;
  if (tier?.limits) {
    try {
      // Attempt to parse limits as JSON if it's a string
      if (typeof tier.limits === 'string') {
        limit = JSON.parse(tier.limits)[resourceType];
      } else if (typeof tier.limits === 'object') {
        // If limits is already an object, access directly
        limit = tier.limits[resourceType];
      }
    } catch (e) {
      console.error('Error parsing tier limits', e);
    }
  }
  
  // Fallback to maxApiCalls if no specific limit found
  if (limit === undefined) {
    limit = tier?.maxApiCalls;
  }
  
  console.log(`===Usage check for ${entityType} ${entityId} on resource ${resourceType}: currentUsage=${currentUsage}, limit=${limit}`);
  if (limit === undefined || limit === null) {
    return { allowed: true, currentUsage, limit: undefined };
  }

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit
  };
}