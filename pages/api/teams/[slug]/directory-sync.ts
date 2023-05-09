import { throwIfNotAllowed } from '@/lib/cerbos';
import env from '@/lib/env';
import jackson from '@/lib/jackson';
import { sendAudit } from '@/lib/retraced';
import { getSession } from '@/lib/session';
import { getTeamWithRole } from 'models/team';
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
      default:
        res.setHeader('Allow', 'GET, POST');
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

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
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
      kind: 'dsync',
      id: teamWithRole.team.id,
    },
    action: 'read',
  });

  const { directorySync } = await jackson();

  const { data, error } = await directorySync.directories.getByTenantAndProduct(
    teamWithRole.team.id,
    env.product
  );

  return res.status(error ? 400 : 200).json({ data, error });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const { name, provider } = req.body;
  const { slug } = req.query as { slug: string };

  const teamWithRole = await getTeamWithRole(slug, session.user.id);

  await throwIfNotAllowed({
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

  const { directorySync } = await jackson();

  const { data, error } = await directorySync.directories.create({
    name,
    type: provider,
    tenant: teamWithRole.team.id,
    product: env.product,
  });

  if (data) {
    sendAudit({
      action: 'dsync.connection.create',
      crud: 'c',
      user: session.user,
      team: teamWithRole.team,
    });
  }

  return res.status(error ? 400 : 201).json({ data, error });
};
