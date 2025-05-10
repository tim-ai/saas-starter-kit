
import axios from 'axios';
import { getSession } from '@/lib/session';

export default async function handler(req, res) {

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

  // fetch from localhost:8000
  const url = `http://127.0.0.1:8000/api/search?userId=${userId}`;

  return await axios.post(url, searchTerm)
    .then(response => {
      const data = response.data;
      // test if hits in data
      if (!data || !data.hits) {
        return res.status(404).json({ message: 'No listings found' });
      }
      var hits = data.hits
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
        _geo: listing._geo,
        lat: listing._geo?.lat,
        lng: listing._geo?.lng
      }));
      res.status(200).json(listings);
    })
    .catch(error => {
      console.error('Error fetching listings:', error.message);
      res.status(500).json({ error: 'Failed to fetch listings', message: error.message });
    });

  // const filePath = path.join(process.cwd(), '../data', 'Westford_MA_listings.jsonl');
  // let listingsData = [];
  
  // try {
  //   const fileContent = fs.readFileSync(filePath, 'utf-8');
    
  //   fileContent.split('\n').forEach((line, index) => {
  //     if (!line.trim()) return;
      
  //     try {
  //       const listing = JSON.parse(line);
  //       const cardData = listing.card_jsonld[0][0];
        
  //       listingsData.push({
  //         id: index + 1,
  //         address: listing.address,
  //         price: listing.price,
  //         beds: parseInt(listing.beds),
  //         baths: parseFloat(listing.baths),
  //         sqft: listing.sqft.replace(/,/g, ''),
  //         url: listing.url,
  //         image: listing.image,
  //         lat: cardData.geo.latitude,
  //         lng: cardData.geo.longitude
  //       });
  //     } catch (parseError) {
  //       console.error(`Error parsing line ${index + 1}: ${parseError.message}`);
  //     }
  //   });
    
  //   res.status(200).json(listingsData);
  // } catch (fileError) {
  //   console.error('Failed to read listings file:', fileError.message);
  //   res.status(500).json({ error: 'Failed to load listings' });
  // }
}