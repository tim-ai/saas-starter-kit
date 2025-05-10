import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import axios from 'axios';
import styles from './index.module.css';
import NitpickList from '../../components/NitpickList';
import MapMarkerWithInfo from '../../components/MapMarkerWithInfo';
import ListingsGrid from '../../components/ListingsGrid';

// Define libraries outside the component
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

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    // margin: '20px auto',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

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

  useEffect(() => {
    if (hoveredListingId) {
      const element = document.getElementById(`listing-${hoveredListingId}`);
      if (element) {
        //element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [hoveredListingId]);

  const handleMapError = (error) => {
    setMapError(`Map Error: ${error.error?.message || error}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`/api/listings?town=${searchTerm}`);
      if (response.data.length === 0) {
        setMapError('No listings found for the specified location.');
        return;
      }
      setListings(response.data);
      const first = response.data[0];
      setMapCenter({ lat: first.lat, lng: first.lng });
      setZoom(12);
      setMarkerPosition({ lat: first.lat, lng: first.lng });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setMapError(`Error fetching listings: ${errorMessage}`);
      console.error('Error fetching listings:', error);
    }
  };

  const markers = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            listing?.lat &&
            listing?.lng &&
            !isNaN(listing.lat) &&
            !isNaN(listing.lng)
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
            placeholder="Search for properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
        libraries={libraries}
        onError={() =>
          setMapError('Failed to load Google Maps. Please check your API key.')
        }
      >
        <div className={styles.mapContainer} style={{ margin: '0 auto', top: '0', zIndex: 10 }}>
          {!isMapLoaded && <div className={styles.mapLoading}>Loading map...</div>}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={zoom}
            center={mapCenter}
            options={{ disableDefaultUI: true }}
            onLoad={() => setIsMapLoaded(true)}
            onError={handleMapError}
          >
            {markers}
            {/* {markerPosition && (
              <MarkerF
                position={markerPosition}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />
            )} */}
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

// Server-side fetching and transformation of nitpicks records.
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

