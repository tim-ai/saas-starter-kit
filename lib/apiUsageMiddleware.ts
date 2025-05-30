import { NextApiRequest, NextApiResponse } from 'next';
import { trackUsage, checkUsageLimit } from './usage';

export function withApiUsage(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const entityId = req.headers['entity-id'] as string || 'system';
    const entityType = req.headers['entity-type'] as 'user' | 'team' || 'system';

    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(entityId, entityType);
    
    if (!usageCheck.allowed) {
      // Return custom quota exceeded page
      return res.status(429).send(`
        <html>
          <head><title>Quota Exceeded</title></head>
          <body>
            <h1>429 - Usage Limit Exceeded</h1>
            <p>You've used ${usageCheck.currentUsage} of ${usageCheck.limit} allowed requests.</p>
            <p>Please upgrade your plan or contact support.</p>
          </body>
        </html>
      `);
    }

    // Track usage and proceed if within limits
    try {
      await trackUsage(entityId, entityType, 1);
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
    
    return handler(req, res);
  };
}