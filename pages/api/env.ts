import env from '@/lib/env';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { mixpanel } = env;

  res.json({ data: { mixpanel } });
}
