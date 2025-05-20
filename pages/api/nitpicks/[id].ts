import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCookie } from 'cookies-next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check user session
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const nitpickId = req.query.id;
  const userId = session.user.id;
  const teamId = await getCookie('currentTeamId', { req, res });

  if (typeof nitpickId !== 'string') {
    return res.status(400).json({ error: 'Invalid nitpick id' });
  }

  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  try {
    // Find the nitpick record
    const nitpick = await prisma.nitpick.findUnique({
      where: { id: nitpickId },
    });
    if (!nitpick) {
      return res.status(404).json({ error: 'Nitpick not found' });
    }
    
    // Only allow deletion if the record belongs to the current user
    // if (nitpick.userId !== userId) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    await prisma.nitpick.deleteMany({
      where: { 
                teamId: teamId,
                realEstateId: nitpick.realEstateId
      },
    });

    res.status(200).json({ message: 'Nitpick deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}