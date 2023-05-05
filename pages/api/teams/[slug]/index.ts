import { cerbos } from '@/lib/cerbos';
import { getSession } from '@/lib/session';
import { deleteTeam, getTeam, getTeamWithRole, updateTeam } from 'models/team';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'PUT':
      return handlePUT(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

// Get a team by slug
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    return res.status(401).json({
      data: null,
      error: { message: 'Unauthorized.' },
    });
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  const isAllowed = await cerbos.isAllowed({
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

  if (!isAllowed) {
    return res.status(400).json({
      data: null,
      error: { message: `You don't have permission to do this action.` },
    });
  }

  const team = await getTeam({ slug });

  return res.status(200).json({ data: team, error: null });
};

// Update a team
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    return res.status(401).json({
      data: null,
      error: { message: 'Unauthorized.' },
    });
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  const isAllowed = await cerbos.isAllowed({
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

  if (!isAllowed) {
    return res.status(400).json({
      data: null,
      error: { message: `You don't have permission to do this action.` },
    });
  }

  const updatedTeam = await updateTeam(slug, {
    name: req.body.name,
    slug: req.body.slug,
    domain: req.body.domain,
  });

  return res.status(200).json({ data: updatedTeam, error: null });
};

// Delete a team
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query as { slug: string };

  const session = await getSession(req, res);

  if (!session) {
    return res.status(401).json({
      data: null,
      error: { message: 'Unauthorized.' },
    });
  }

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  const isAllowed = await cerbos.isAllowed({
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

  if (!isAllowed) {
    return res.status(400).json({
      data: null,
      error: { message: `You don't have permission to do this action.` },
    });
  }

  await deleteTeam({ slug });

  return res.status(200).json({ data: {}, error: null });
};
