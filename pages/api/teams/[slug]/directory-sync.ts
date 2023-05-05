import { cerbos } from '@/lib/cerbos';
import env from '@/lib/env';
import jackson from '@/lib/jackson';
import { getSession } from '@/lib/session';
import { getTeamWithRole } from 'models/team';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    case 'POST':
      return await handlePOST(req, res);
    default:
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

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
      kind: 'dsync',
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

  const { directorySync } = await jackson();

  const { data, error } = await directorySync.directories.getByTenantAndProduct(
    teamWithRole.team.id,
    env.product
  );

  return res.status(error ? 400 : 200).json({ data, error });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, provider } = req.body;
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
      kind: 'dsync',
      id: teamWithRole.team.id,
    },
    action: 'create',
  });

  if (!isAllowed) {
    return res.status(400).json({
      data: null,
      error: { message: `You don't have permission to do this action.` },
    });
  }

  const { directorySync } = await jackson();

  const { data, error } = await directorySync.directories.create({
    name,
    type: provider,
    tenant: teamWithRole.team.id,
    product: env.product,
  });

  return res.status(error ? 400 : 201).json({ data, error });
};
