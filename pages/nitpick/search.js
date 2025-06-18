import { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import { FaSpinner, FaCog } from 'react-icons/fa';
import axios from 'axios';
import styles from './index.module.css';
import NitpickList from '../../components/NitpickList';
import MapMarkerWithInfo from '../../components/MapMarkerWithInfo';
import ListingsGrid from '../../components/ListingsGrid';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSession } from 'next-auth/react';
import { toggleFavorite } from '@/lib/favorite';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';

export default function Map3D({ nitpicks: serverNitpicks }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || null;
  const { keywords: queryKeywords } = router.query;

  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 42.3601, lng: -71.0589 });
  const [zoom, setZoom] = useState(10);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [nitpicks, setNitpicks] = useState(serverNitpicks || []);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const submitButtonRef = useRef(null);

  const currentTeamId = getCookie('currentTeamId');

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  useEffect(() => {
    if (queryKeywords) {
      setSearchTerm(queryKeywords);
      setTimeout(() => {
        if (submitButtonRef.current) {
          submitButtonRef.current.click();
        }
      }, 100);
    }
  }, [queryKeywords]);

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
        // element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [hoveredListingId]);

  const handleMapError = (error) => {
    setMapError(`Map Error: ${error.error?.message || error}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const searchParams = {
        query: searchTerm,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        minPrice: minPrice,
        maxPrice: maxPrice
      };
      const response = await axios.post(`/api/search`, searchParams);
      if (response.data.length === 0) {
        setMapError('No listings found for the specified location.');
        setLoading(false);
        return;
      }
      const listings = response.data.map((listing) => ({
        ...listing,
        isFavorite: nitpicks.some((nitpick) => nitpick.id === listing.id),
      }));

      setListings(listings);
      const first = listings[0];
      setMapCenter({ lat: first.lat, lng: first.lng });
      setZoom(12);
      setMarkerPosition({ lat: first.lat, lng: first.lng });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setMapError(`Error fetching listings: ${errorMessage}`);
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const markers = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            listing?._geo?.lat &&
            listing?._geo?.lng &&
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
            onFavorite={async (listing) => {
              if (!userId) {
                console.error('User not logged in!');
                return;
              }
              try {
                await toggleFavorite(listing, nitpicks, setNitpicks, userId, currentTeamId);
              } catch (error) {
                console.error(error);
              }
            }}
            linkType="nitpick"
          />
        )),
    [listings, hoveredListingId, hoverTimeout]
  );

  return (
    <div className={styles.container2col}>
      <div className={styles.searchContainer}>
         <div className={styles.searchHeader}>
          <h1 className={styles.searchTitle}>Search listings by town name or keywords</h1>
        </div>
        <header className={styles.searchHeader}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchRow}>
              <input
                type="text"
                placeholder="Search Your Dream Home..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className={loading ? `${styles.searchButton} ${styles.loading}` : styles.searchButton}
                disabled={loading}
                ref={submitButtonRef}
              >
                {loading ? 'Processing...' : 'Search'}
              </button>
              <FaCog
                className={styles.advancedToggle}
                onClick={() => setShowAdvanced(!showAdvanced)}
                title="Advanced search settings"
                style={{ cursor: 'pointer' }}
              />
            </div>

            {showAdvanced && (
              <div className={styles.advancedSettings}>
                <div className={styles.filterGroup}>
                  <label>Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="Any"
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label>Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="Any"
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label>Min Price</label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="$ Min"
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label>Max Price</label>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="$ Max"
                  />
                </div>
              </div>
            )}
          </form>
        </header>

        {/* No local <LoadScript> wrapper – assume the API is loaded via _app.tsx */}
        <div className={styles.mapContainer} style={{ flex: '100%', margin: '0 auto', top: '0', zIndex: 10 }}>
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
          </GoogleMap>
        </div>

        {mapError && (
          <div className={styles.errorBanner}>
            {mapError}
          </div>
        )}

        <ListingsGrid
          listings={listings}
          hoveredListingId={hoveredListingId}
          setHoveredListingId={setHoveredListingId}
          onFavorite={async (listing) => {
            if (!userId) {
              console.error('User not logged in!');
              return;
            }
            try {
              await toggleFavorite(listing, nitpicks, setNitpicks, userId, currentTeamId);
            } catch (error) {
              console.error(error);
            }
          }}
        />
      </div>

      {nitpicks.length > 0 && (
        <div className={styles.savedSection}>
          <h2 className={styles.savedTitle}>Your Favorite</h2>
          <NitpickList
            nitpicks={nitpicks}
            hoveredListingId={hoveredListingId}
            setHoveredListingId={setHoveredListingId}
            onDeleteFavorite={(nitpickId) => {
              setNitpicks((prevNitpicks) =>
                prevNitpicks.filter((nitpick) => nitpick.id !== nitpickId)
              );
            }}
          />
        </div>
      )}

      {loading && (
        <div className={styles.spinnerOverlay}>
          <FaSpinner className={styles.spinner} />
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
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),

      nitpicks
    },
  };
}
