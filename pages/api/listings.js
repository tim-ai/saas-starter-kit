
import axios from 'axios';

export default async function handler(req, res) {

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { query } = req;
  const searchTerm = query.town || '';

  // Validate search term
  if (searchTerm.length < 3) {
    return res.status(400).json({ message: 'Search term must be at least 3 characters long' });
  }

  // fetch from localhost:9090
  const url = `http://127.0.0.1:9090/api/listings?town=${searchTerm}`;

  return await axios.get(url)
    .then(response => {
      const data = response.data;
      if (data.length === 0) {
        return res.status(404).json({ message: 'No listings found' });
      }
      const listings = data.map((listing) => ({
        id: listing.id,
        address: listing.address,
        price: listing.price,
        beds: parseInt(listing.beds),
        baths: parseFloat(listing.baths),
        sqft: listing.sqft.replace(/,/g, ''),
        url: listing.url,
        image: listing.image,
        _geo: listing._geo,
        lat: listing._geo["lat"],
        lng: listing._geo["lng"]
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