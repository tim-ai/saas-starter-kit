import { redis } from './redis';
import { prisma } from './prisma';
import type { User, Team } from '@prisma/client';

export async function getUsage(entityId: string, entityType: 'user' | 'team'): Promise<number> {
  const key = `usage:${entityType}:${entityId}`;
  const value = await redis.get<number>(key);
  return value || 0;
}

export async function trackUsage(entityId: string, entityType: 'user' | 'team', incrementBy: number = 1): Promise<number> {
  const key = `usage:${entityType}:${entityId}`;
  return redis.increment(key, incrementBy);
}

export async function resetUsage(entityId: string, entityType: 'user' | 'team'): Promise<void> {
  const key = `usage:${entityType}:${entityId}`;
  await redis.del(key);
}

export async function checkUsageLimit(entityId: string, entityType: 'user' | 'team'): Promise<{
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

  // Handle case where entity doesn't exist or doesn't have a tier
  if (!entity || !('tier' in entity) || !entity.tier) {
    return { allowed: true, currentUsage: 0 };
  }

  const tier = entity.tier;

  // Use requestLimit field instead of limit
  // Use requestLimit field for usage limits
  if (!tier.requestLimit) {
    return { allowed: true, currentUsage: 0 };
  }

  const currentUsage = await getUsage(entityId, entityType);
  return {
    allowed: currentUsage < tier.requestLimit,
    currentUsage,
    limit: tier.requestLimit
  };
}