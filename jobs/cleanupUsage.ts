import { redis } from '../lib/redis';
import { resetUsage } from '../lib/usage';
import { cronService } from '../lib/cron';

async function cleanupUsageJob() {
  try {
    console.log('Starting usage cleanup job');
    
    // Get all usage keys from Redis
    const keys = await redis.keys('usage:*');
    
    for (const key of keys) {
      const [, entityType, entityId, resourceType] = key.split(':');
      
      // Reset usage in both Redis and database
      await resetUsage(entityId, entityType as any, resourceType);
    }
    
    console.log(`Cleaned up ${keys.length} usage records`);
  } catch (error) {
    console.error('Error in cleanupUsageJob:', error);
  }
}

// Register the cleanup job to run every Sunday at 00:00
cronService.registerJob({
  name: 'usage-cleanup',
  schedule: '0 0 * * 1', // At 00:00 on Monday
  job: cleanupUsageJob
});