import { getSession } from '@/lib/session';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Connection', 'keep-alive');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!req.body) {
    res.status(400).json({ error: 'Address is required' });
    return;
  }

  const { address } = req.body;

  // Get user session and extract user id.
  const session = await getSession(req, res);
  if (!session || !session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  //const email = session?.user.email as string;

  const userId = session?.user.id;

  const abortController = new AbortController();

  try {
    const apiResponse = await fetch(
      'http://127.0.0.1:8000/api/streaming/nitpick?user=' + userId + '&address=' + encodeURIComponent(address),
      {
        signal: abortController.signal,
      }
    );

    // Forward status and headers from backend
    res.status(apiResponse.status);
    apiResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Stream response chunks
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert and write immediately without buffering
        const text = decoder.decode(value);
        res.write(text);
        res.flush();

        // Check if client disconnected
        if (req.aborted) {
          await reader.cancel();
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
    res.end();
  } catch (error) {
    abortController.abort();
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}