import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import styles from './index.module.css';
import NitpickList from '../../components/NitpickList';
import MapMarkerWithInfo from '../../components/MapMarkerWithInfo';
import ListingsGrid from '../../components/ListingsGrid';
import { MeiliSearch } from 'meilisearch';

const libraries = ['places'];

export default function Map3D({ nitpicks: serverNitpicks }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 42.3601, lng: -71.0589 });
  const [zoom, setZoom] = useState(10);
  const [setMarkerPosition] = useState(null);
  const [nitpicks] = useState(serverNitpicks || []);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Initialize MeiliSearch client
  const client = new MeiliSearch({
    host: 'http://192.168.1.12:7700',
    apiKey: '7ccdf1ae5b660d017468d18b9a2f5ac80c3c072b15e5b00ff594fe1a65de3512'
  });

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  // Get user's location if possible
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setMapCenter({ lat: 42.3601, lng: -71.0589 });
        }
      );
    }
  }, []);

  // Query MeiliSearch when the form is submitted
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const index = client.index('slistings');
      const result = await index.search(searchTerm);
      if (result.hits.length === 0) {
        setMapError('No listings found for the specified location.');
        return;
      }
      setListings(result.hits);
      // Use the first hit's geo information (assuming you've set up Geo search in Meili)
      const first = result.hits[0];
      console.log(first);
      if (first._geo) {

        setMapCenter({ lat: first._geo.lat, lng: first._geo.lng });
        setZoom(12);
        setMarkerPosition({ lat: first._geo.lat, lng: first._geo.lng });
      }
      setMapError(null);
    } catch (error) {
      setMapError(`Error fetching listings: ${error.message}`);
    }
  };

  // Create markers from the listings
  const markers = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            listing?._geo &&
            !isNaN(listing._geo.lat) &&
            !isNaN(listing._geo.lng)
        )
        .map((listing) => (
          <MapMarkerWithInfo
            key={listing.id}
            listing={listing}
            hoveredListingId={hoveredListingId}
            setHoveredListingId={setHoveredListingId}
            hoverTimeout={hoverTimeout}
            setHoverTimeout={setHoverTimeout}
          />
        )),
    [listings, hoveredListingId, hoverTimeout]
  );

  return (
    <div className={styles.container2col}>
      <div className={styles.searchContainer}>
        <header className={styles.searchHeader}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search properties by keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">
              Search
            </button>
          </form>
        </header>

        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
          libraries={libraries}
          onError={() =>
            setMapError('Failed to load Google Maps. Please check your API key.')
          }
        >
          <div
            className={styles.mapContainer}
            style={{ margin: '0 auto', top: '0', zIndex: 10 }}
          >
            {!isMapLoaded && <div className={styles.mapLoading}>Loading map...</div>}
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={zoom}
              center={mapCenter}
              options={{ disableDefaultUI: true }}
              onLoad={() => setIsMapLoaded(true)}
              onError={(error) => setMapError(`Map Error: ${error.error?.message || error}`)}
            >
              {markers}
            </GoogleMap>
          </div>
        </LoadScript>

        {mapError && (
          <div className={styles.errorBanner}>
            {mapError}
          </div>
        )}

        <ListingsGrid
          listings={listings}
          hoveredListingId={hoveredListingId}
          setHoveredListingId={setHoveredListingId}
        />
      </div>

      {nitpicks.length > 0 && (
        <div className={styles.savedSection}>
          <h2 className={styles.savedTitle}>Your Saved Listings</h2>
          <NitpickList
            nitpicks={nitpicks}
            hoveredListingId={hoveredListingId}
            setHoveredListingId={setHoveredListingId}
          />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;

  const historyResponse = await fetch(`${protocol}://${host}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: context.req.headers.cookie || '',
    },
  });

  let data = [];
  if (historyResponse.ok) {
    data = await historyResponse.json();
  }

  const { transformNitpick } = require('@/lib/nitpick');
  const nitpicks = data.map(transformNitpick);

  return {
    props: { nitpicks },
  };
}

