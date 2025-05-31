import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { Session } from 'next-auth';
import { trackUsage, checkUsageLimit, type UsageCheckResult } from './usage';

/**
 * API Usage Middleware
 *
 * This module provides middleware functions for tracking API usage and enforcing usage limits.
 *
 * Features:
 * - Tracks API usage with Redis caching
 * - Enforces usage limits based on user/team tiers
 * - Supports both HTML and JSON error responses
 * - Provides separate middleware for tracking-only use cases
 * - Automatically sets required headers using NextAuth session
 *
 * Usage Examples:
 *
 * 1. Basic usage with HTML error responses:
 *    import { withApiUsage } from '@/lib/apiUsageMiddleware';
 *
 *    export default withApiUsage(async (req, res) => {
 *      // Your API handler logic here
 *      res.status(200).json({ message: 'Success' });
 *    });
 *
 * 2. Usage with JSON error responses (for API endpoints):
 *    export default withApiUsage(async (req, res) => {
 *      // Your API handler logic here
 *      res.status(200).json({ data: 'some data' });
 *    }, { jsonErrors: true });
 *
 * 3. Tracking-only middleware (no limit enforcement):
 *    import { withApiTrackingOnly } from '@/lib/apiUsageMiddleware';
 *
 *    export default withApiTrackingOnly(async (req, res) => {
 *      // Your API handler logic here
 *      res.status(200).json({ result: 'tracked but not limited' });
 *    });
 *
 * Automatic Header Setting:
 * The middleware now automatically sets these values using NextAuth session:
 * - entity-id: User ID from session
 * - entity-type: Always 'user' (teams not yet supported)
 * - resource-type: API route path (e.g., '/api/search')
 *
 * No need to set headers manually in frontend!
 */

interface ApiUsageOptions {
  /**
   * Custom resource type if not using API route path
   */
  resourceType?: string;
  /**
   * When true, returns JSON error responses instead of HTML pages
   * when usage limits are exceeded. Default: false
   */
  jsonErrors?: boolean;
}

export function withApiUsage(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: ApiUsageOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get NextAuth session
    const session: Session | null = await getSession(req, res);
    
    // Determine entity details from session
    const entityId = session?.user?.id || 'system';
    const entityType: 'user' | 'team' | 'system' = session?.user ? 'user' : 'system';
    
    // Use custom resource type or default to API route path
    const resourceType = options.resourceType || req.url || 'api-request';

    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(entityId, entityType, resourceType);
    
    if (!usageCheck.allowed) {
      return handleQuotaExceeded(res, usageCheck, options.jsonErrors || false);
    }

    // Track usage and proceed if within limits
    try {
      await trackUsage(entityId, entityType, resourceType, 1);
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
    
    return handler(req, res);
  };
}

// New function to track API usage without checking limits
export function withApiTrackingOnly(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: ApiUsageOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get NextAuth session
    const session: Session | null = await getSession(req, res);
    
    // Determine entity details from session
    const entityId = session?.user?.id || 'system';
    const entityType = session?.user ? 'user' : 'system';
    
    // Use custom resource type or default to API route path
    const resourceType = options.resourceType || req.url || 'api-request';

    // Track usage without limit check
    try {
      await trackUsage(entityId, entityType, resourceType, 1);
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
    
    return handler(req, res);
  };
}

/**
 * Helper function to handle quota exceeded responses consistently
 */
function handleQuotaExceeded(
  res: NextApiResponse,
  usageCheck: UsageCheckResult,
  jsonErrors: boolean
) {
  if (jsonErrors) {
    return res.status(429).json({
      error: 'Usage limit exceeded',
      code: 'QUOTA_EXCEEDED',
      currentUsage: usageCheck.currentUsage,
      limit: usageCheck.limit,
      message: `You've used ${usageCheck.currentUsage} of ${usageCheck.limit} allowed requests. Please upgrade your plan.`
    });
  } else {
    return res.status(429).send(`
          429 - Usage Limit Exceeded.
          You've used ${usageCheck.currentUsage} of ${usageCheck.limit} allowed requests.
          Please upgrade your plan or contact support.
    `);
  }
}