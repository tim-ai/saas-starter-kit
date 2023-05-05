import { slugify } from '@/lib/common';
import { getSession } from '@/lib/session';
import { createTeam, getTeams, isTeamExists } from 'models/team';
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
        res.setHeader('Allow', ['GET', 'POST']);
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

// Get teams
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  return res
    .status(200)
    .json({ data: await getTeams(session.user.id), error: null });
};

// Create a team
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized.');
  }

  const { name } = req.body;

  const slug = slugify(name);

  if (await isTeamExists({ slug })) {
    throw new Error('A team with the name already exists.');
  }

  const team = await createTeam({
    userId: session.user.id as string,
    name,
    slug,
  });

  return res.status(201).json({ data: team, error: null });
};
