import { throwIfNotAllowed } from '@/lib/cerbos';
import { prisma } from '@/lib/prisma';
import { sendAudit } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import { sendEvent } from '@/lib/svix';
import { Role } from '@prisma/client';
import { getTeamMembers, getTeamWithRole, removeTeamMember } from 'models/team';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      case 'PUT':
        return await handlePUT(req, res);
      case 'PATCH':
        return await handlePATCH(req, res);
      default:
        res.setHeader('Allow', 'GET, DELETE, PUT, PATCH');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    return res.status(400).json({
      error: { message: error.message || 'Bad request.' },
    });
  }
}

// Get members of a team
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'members',
      id: teamWithRole.team.id,
    },
    action: 'read',
  });

  return res.json({
    data: await getTeamMembers(slug),
    error: null,
  });
};

// Delete the member from the team
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };
  const { memberId } = req.body;

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'members',
      id: teamWithRole.team.id,
    },
    action: 'delete',
  });

  const teamMember = await removeTeamMember(teamWithRole.team.id, memberId);

  await sendEvent(teamWithRole.team.id, 'member.removed', teamMember);

  sendAudit({
    action: 'member.remove',
    crud: 'd',
    user: session.user,
    team,
  });

  return res.status(200).json({ data: {} });
};

// Leave a team
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  const teamOwnersCount = await prisma.teamMember.count({
    where: {
      teamId: teamWithRole.team.id,
      role: 'OWNER',
    },
  });

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'team',
      id: teamWithRole.team.id,
      attributes: {
        teamOwnersCount,
      },
    },
    action: 'leave',
  });

  await removeTeamMember(teamWithRole.team.id, session.user.id);

  return res.status(200).json({ data: {} });
};

// Update the role of a member
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };
  const { memberId, role } = req.body as { memberId: string; role: Role };

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'members',
      id: teamWithRole.team.id,
    },
    action: 'update',
  });

  const memberUpdated = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId: teamWithRole.team.id,
        userId: memberId,
      },
    },
    data: {
      role,
    },
  });

  sendAudit({
    action: 'member.update',
    crud: 'u',
    user: session.user,
    team,
  });

  return res.status(200).json({ data: memberUpdated });
};
