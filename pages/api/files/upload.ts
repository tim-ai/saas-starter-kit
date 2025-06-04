import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import multer from 'multer';
import { FileStorageService, UploadedFile } from '@/lib/storage/FileStorageService';
import { prisma } from '@/lib/prisma';
import { trackUsage } from '@/lib/usage';
import { getAuthOptions } from '@/lib/nextAuth';
import type { RequestHandler } from 'express';

// Disable Next.js built-in body parsing so multer can handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to run middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: RequestHandler
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cast req/res to any so they satisfy Express types
    fn(req as any, res as any, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Run multer middleware to parse multipart/form-data and attach files to req.files
  try {
    // Explicitly cast upload.array('files') to RequestHandler
    await runMiddleware(req, res, upload.array('files') as RequestHandler);
  } catch (error) {
    console.error('Multer error:', error);
    return res.status(500).json({
      error: 'File upload failed: unable to parse form data',
    });
  }

  const authOptions = getAuthOptions(req, res);

  // Retrieve user session using server-only method
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract files from the request
  const files = (req as NextApiRequest & { files: UploadedFile[] }).files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Define your storage configuration (adjust as needed)
  const storageConfig = {
    type: 'local' as const,
    local: { directory: './uploads' },
  };
  const storageService = new FileStorageService(storageConfig);

  try {
    const results: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
      contentType: string;
    }> = [];

    // Process each file: upload to storage, save metadata, and track usage
    for (const file of files) {
      // Upload the file using your storage service
      const storedFile = await storageService.uploadFile(file);

      // Save file metadata to the database
      const dbFile = await prisma.file.create({
        data: {
          name: file.originalname,
          key: storedFile.key,
          size: file.size,
          contentType: file.mimetype,
          userId: session.user.id,
        },
      });

      // Update usage stats by tracking the file size
      await trackUsage(session.user.id, 'user', 'storage', file.size);

      results.push({
        id: dbFile.id,
        name: dbFile.name,
        url: storedFile.url,
        size: dbFile.size,
        contentType: dbFile.contentType,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('File upload failed:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
}