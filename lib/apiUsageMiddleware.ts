import { NextApiRequest, NextApiResponse } from 'next';
import { trackUsage } from './usage';

export function withApiUsage(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Track usage before handling the request
    const entityId = req.headers['entity-id'] as string || 'system';
    const entityType = req.headers['entity-type'] as 'user' | 'team' || 'system';
    
    try {
      await trackUsage(entityId, entityType, 1);
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
    
    return handler(req, res);
  };
}