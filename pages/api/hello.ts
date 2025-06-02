import type { NextApiRequest, NextApiResponse } from 'next';


import { cronService } from '../../lib/cron';

console.log('Initializing cron service...');
// Start cron service only in Node.js runtime
if (process.env.NEXT_RUNTIME === 'nodejs') {
  cronService.start();
  console.log('Cron service started');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ message: 'Hello World!' });
}
