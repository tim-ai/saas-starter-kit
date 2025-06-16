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

  // Parse request body
  let queryObj;
  if (typeof req.body === 'string') {
    try {
      queryObj = JSON.parse(req.body);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
  } else {
    queryObj = req.body;
  }

  // Validate search term
  if (!queryObj.lat || !queryObj.lng || !queryObj.radius) {
    return res.status(400).json({ message: 'Must include lat, lng, and radius' });
  }

  const session = await getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  // Read AI server IP and port from .env variables
  const aiServerIp = process.env.AISERVER_IP || '127.0.0.1';
  const aiServerPort = process.env.AISERVER_PORT || '9090';
  const url = `http://${aiServerIp}:${aiServerPort}/api/geosearch?userId=${userId}`;

  return axios.post(url, {
    lat: queryObj.lat,
    lng: queryObj.lng,
    radius: queryObj.radius
  })
    .then(response => {
      const data = response.data;
      // test if hits in data
      if (!data || !data.hits) {
        return res.status(200).json({ listings: [] });
      }

      const hits = data.hits;
      const listings = hits.map((listing) => ({
        id: listing.id,
        address: listing.address,
        price: listing.price,
        status: listing.status,
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
      console.error('Error fetching listings:', error);
      res.status(500).json({ error: 'Failed to fetch listings', message: error.message });
    });
}