import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;
  const { issueId, vote } = req.body; // vote should be a number (e.g., +1 for thumb-up, -1 for thumb-down)

  if (!issueId || typeof vote !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }
  try {
    // Use upsert so that if a vote already exists for the issue by this user, update it,
    // otherwise create a new record.
    const newVote = await prisma.issueVote.upsert({
      where: {
        // Prisma requires a unique identifier. Our schema defines @@unique([issueId, userId]).
        // The composite unique key is referenced here as "issueId_userId".
        issueId_userId: { issueId, userId },
      },
      update: {
        vote,
      },
      create: {
        issueId,
        userId,
        vote,
        // Optionally: add teamId if available, e.g.,
        // teamId: session.user.teamId,
      },
    });
    res.status(200).json(newVote);
  } catch (error) {
    console.error('Failed to upsert vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}