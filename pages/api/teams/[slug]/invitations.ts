import { throwIfNotAllowed } from '@/lib/cerbos';
import { sendTeamInviteEmail } from '@/lib/email/sendTeamInviteEmail';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEvent } from '@/lib/svix';
import {
  createInvitation,
  deleteInvitation,
  getInvitation,
  getInvitations,
} from 'models/invitation';
import { addTeamMember, getTeamWithRole } from 'models/team';
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
      case 'POST':
        return await handlePOST(req, res);
      case 'PUT':
        return await handlePUT(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', 'GET, POST, PUT, DELETE');
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

// Invite a user to an team
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, role } = req.body;
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
      kind: 'invitations',
      id: teamWithRole.team.id,
    },
    action: 'create',
  });

  const invitationExists = await prisma.invitation.findFirst({
    where: {
      email,
      teamId: teamWithRole.team.id,
    },
  });

  if (invitationExists) {
    throw new Error('An invitation already exists for this email.');
  }

  const invitation = await createInvitation({
    teamId: teamWithRole.team.id,
    invitedBy: session.user.id,
    email,
    role,
  });

  await sendEvent(teamWithRole.team.id, 'invitation.created', invitation);

  await sendTeamInviteEmail(teamWithRole.team, invitation);

  return res.status(200).json({ data: invitation });
};

// Get all invitations for an organization
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
      kind: 'invitations',
      id: teamWithRole.team.id,
    },
    action: 'read',
  });

  const invitations = await getInvitations(teamWithRole.team.id);

  return res.status(200).json({ data: invitations });
};

// Delete an invitation
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.body;
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  const invitation = await getInvitation({ id });

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'invitations',
      id: teamWithRole.team.id,
      attributes: {
        author: invitation.invitedBy,
      },
    },
    action: 'delete',
  });

  await deleteInvitation({ id });

  await sendEvent(teamWithRole.team.id, 'invitation.removed', invitation);

  return res.status(200).json({ data: {} });
};

// Accept an invitation to an organization
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { inviteToken } = req.body as { inviteToken: string };

  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const invitation = await getInvitation({ token: inviteToken });

  const teamMember = await addTeamMember(
    invitation.team.id,
    session.user.id,
    invitation.role
  );

  await sendEvent(invitation.team.id, 'member.created', teamMember);

  await deleteInvitation({ token: inviteToken });

  return res.status(200).json({ data: {} });
};
