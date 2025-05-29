import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/lib/session';
import { stripe, getBillingCustomerId } from '@/lib/stripe';
import env from '@/lib/env';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Session not found');
  }
  const user = session.user;
  if (!user?.id) {
    throw new Error('Could not get user');
  }
  
  const customerId = await getBillingCustomerId({
    user: user,
    session
  });

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.appUrl}/settings/subscription`,
  });

  res.json({ data: { url } });
};
