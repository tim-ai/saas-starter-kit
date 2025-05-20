import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req, res) {
  const { issueId } = req.query;
  if (!issueId) {
    return res.status(400).json({ error: 'Missing issueId' });
  }
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  if (req.method === 'DELETE') {
    try {
      // Fetch the issue to confirm ownership (assumed stored in createdBy)
      const issue = await prisma.realEstateIssue.findUnique({
        where: { id: issueId },
      });
      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      if (issue.createdBy !== userId) {
        return res.status(403).json({ error: 'Forbidden: Only the owner can delete this issue' });
      }
      await prisma.realEstateIssue.delete({
        where: { id: issueId },
      });
      res.status(200).json({ message: 'Issue deleted successfully' });
    } catch (error) {
      console.error('Error deleting issue:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}