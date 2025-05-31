import axios from 'axios';
import { getSession } from '@/lib/session';

import { withApiTrackingOnly } from '@/lib/apiUsageMiddleware';

export default withApiTrackingOnly(handler, {
  resourceType: 'views',
});

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const searchTerm = req.body;

  // Validate search term
  if (searchTerm.length < 2) {
    return res.status(400).json({ message: 'Search term must be at least 2 characters long' });
  }

  const session = await getSession(req, res);
  if (!session || !session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userId = session?.user.id;

  // Read AI server IP and port from .env variables
  const aiServerIp = process.env.AISERVER_IP || '127.0.0.1';
  const aiServerPort = process.env.AISERVER_PORT || '9090';
  const url = `http://${aiServerIp}:${aiServerPort}/api/search?userId=${userId}`;

  return await axios.post(url, searchTerm)
    .then(response => {
      const data = response.data;
      // test if hits in data
      if (!data || !data.hits) {
        return res.status(404).json({ message: 'No listings found' });
      }
      const hits = data.hits;
      if (hits.length === 0) {
        return res.status(404).json({ message: 'No hits found' });
      }

      const listings = hits.map((listing) => ({
        id: listing.id,
        address: listing.address,
        price: listing.price,
        beds: parseInt(listing.bedrooms),
        baths: parseFloat(listing.bathrooms),
        garage: parseInt(listing.garage),
        sqft: listing.area,
        url: listing.url,
        image: listing.image,
        _geo: {
          lat: parseFloat(listing._geo?.lat),
          lng: parseFloat(listing._geo?.lng)
        },
        lat: parseFloat(listing._geo?.lat),
        lng: parseFloat(listing._geo?.lng)
      }));

      res.status(200).json(listings);
    })
    .catch(error => {
      console.error('Error fetching listings:', error.message);
      res.status(500).json({ error: 'Failed to fetch listings', message: error.message });
    });
}