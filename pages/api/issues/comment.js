import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCookie } from 'cookies-next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;
  const { issueId, text } = req.body;
  if (!issueId || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const teamId = await getCookie('currentTeamId', { req, res });

  try {
    const newComment = await prisma.issueComment.create({
      data: {
        issueId,
        content: text,
        createdBy: userId,
        teamId: teamId,
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}