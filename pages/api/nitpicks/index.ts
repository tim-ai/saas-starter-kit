import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check user session and extract the user id
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  // Expect a realEstateId in the request body; teamId is optional.
  const { realEstateId, teamId } = req.body;
  if (!realEstateId) {
    return res.status(400).json({ error: 'Missing realEstateId' });
  }

  let finalTeamId = teamId;
  // If teamId not provided, try to lookup the user's default team (or the first team they belong to)
  if (!finalTeamId) {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true },
    });
    if (!teamMember) {
      return res.status(400).json({ error: 'User is not a member of any team' });
    }
    finalTeamId = teamMember.team.id;
  }

  try {
    const nitpick = await prisma.nitpick.create({
      data: {
        userId,
        realEstateId,
        teamId: finalTeamId,
      },
    });
    return res.status(201).json(nitpick);
  } catch (error) {
    console.error('Error creating nitpick:', error);
    return res.status(500).json({ error: 'Failed to create nitpick' });
  }
}