import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req, res) {
  const { commentId } = req.query;
  if (!commentId) {
    return res.status(400).json({ error: 'Missing commentId' });
  }
  const session = await getSession(req, res);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  if (req.method === 'DELETE') {
    try {
      // Retrieve the comment to check ownership.
      const comment = await prisma.issueComment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.createdBy !== userId) {
        return res.status(403).json({ error: 'Forbidden: You are not the owner of this comment' });
      }
      await prisma.issueComment.delete({
        where: { id: commentId },
      });
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}