import { throwIfNotAllowed } from '@/lib/cerbos';
import { sendAudit } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import { deleteTeam, getTeam, getTeamWithRole, updateTeam } from 'models/team';
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
      case 'PUT':
        return await handlePUT(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({
          data: null,
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    return res.status(400).json({
      error: { message: error.message || 'Something went wrong.' },
    });
  }
}

// Get a team by slug
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
      kind: 'team',
      id: teamWithRole.team.id,
    },
    action: 'read',
  });

  return res.json({
    data: await getTeam({ slug }),
    error: null,
  });
};

// Update a team
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const { slug } = req.query as { slug: string };

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'team',
      id: teamWithRole.team.id,
    },
    action: 'update',
  });

  const updatedTeam = await updateTeam(slug, {
    name: req.body.name,
    slug: req.body.slug,
    domain: req.body.domain,
  });

  sendAudit({
    action: 'team.update',
    crud: 'u',
    user: session.user,
    team: teamWithRole.team,
  });

  return res.status(200).json({ data: updatedTeam, error: null });
};

// Delete a team
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const { slug } = req.query as { slug: string };

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
    principal: {
      id: session.user.id,
      roles: [teamWithRole.role],
    },
    resource: {
      kind: 'team',
      id: teamWithRole.team.id,
    },
    action: 'delete',
  });

  await deleteTeam({ slug });

  sendAudit({
    action: 'team.delete',
    crud: 'd',
    user: session.user,
    team: teamWithRole.team,
  });

  return res.status(200).json({ data: {}, error: null });
};
