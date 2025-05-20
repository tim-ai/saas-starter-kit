import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCookie } from 'cookies-next';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Get user session and extract user id.
  const session = await getSession(req, res);
  if (!session || !session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userId = session.user.id;

  const currentTeamId = await getCookie('currentTeamId', {req, res});
  console.log('Current Team ID:', currentTeamId);

  try {
    /*
      Query explanation:
      1. Join Nitpick and RealEstate tables.
      2. Filter nitpicks to only include records where teamId is null or equals currentTeamId.
      3. Group by RealEstate id so that each real estate object appears only once.
      4. Compute a "userFlag" which is 0 if any nitpick for that real estate was created by the current user (thus prioritized),
         and 1 otherwise.
      5. Compute the max(createdAt) value as "lastCreated" for each real estate.
      6. Order first by userFlag (current user's nitpicks first) and then by lastCreated (descending).
    */
    const realEstates = await prisma.$queryRaw`
      SELECT r.*, 
             MIN(CASE WHEN n."userId" = ${userId} THEN 0 ELSE 1 END) AS "userFlag",
             MAX(n."createdAt") AS "lastCreated",
             MAX(n.id) AS "nid"
      FROM "Nitpick" n
      -- INNER JOIN "RealEstate" r ON n."realEstateId" = r.id
      -- WHERE n."teamId" IS NULL OR n."teamId" = ${currentTeamId}
      INNER JOIN "RealEstate" r
        ON n."realEstateId" = r.id
        AND ( n."teamId" IS NULL
              OR n."teamId" = ${currentTeamId} )
      GROUP BY r.id
      ORDER BY "userFlag", "lastCreated" DESC
    `;
    res.status(200).json(realEstates);
  } catch (error) {
    console.error('Error fetching real estates:', error);
    res.status(500).json({ error: error.message });
  }
}