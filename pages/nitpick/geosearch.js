import { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useLoadScript, Autocomplete } from '@react-google-maps/api';
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


// Define libraries outside the component
const libraries = ['places'];

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

  const [radius, setRadius] = useState('');
  const submitButtonRef = useRef(null);
  const [address, setAddress] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);



  const currentTeamId = getCookie('currentTeamId');

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    libraries, // ['places']
  });

  // Always call your hooks unconditionally
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
    if (isLoaded && navigator.geolocation) {
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
    setLoading(true);
    console.log('Search initiated with address:', address, " radius:", radius);

    if (typeof window.google === 'undefined') {
      setMapError('Google Maps API not loaded');
      setLoading(false);
      return;
    }
    
    // Validate: radius search requires a starting address
    if (!address.trim()) return;
    console.log('Search 2 with address:', address, " radius:", radius);

    let place;
    if (autocomplete) {
      place = autocomplete.getPlace();
      if (!place || !place.geometry) {
        const service = new window.google.maps.places.AutocompleteService();
        const predictions = await new Promise((resolve, reject) => {
          service.getPlacePredictions({ input: address }, (preds, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(preds);
            } else {
              reject(status);
            }
          });
        });
        if (predictions && predictions.length > 0) {
          const placesService = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
          place = await new Promise((resolve, reject) => {
            placesService.getDetails({ placeId: predictions[0].place_id }, (placeResult, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(placeResult);
              } else {
                reject(status);
              }
            });
          });
        }
      }
    }

    let lat, lng;
    if (place && place.geometry) {
      if (place.formatted_address) {
        setAddress(place.formatted_address);
      }
      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });

    }
    
    const searchParams = {
      lat: lat,
      lng: lng,
      radius: radius,
    };
    try {
    const response = await axios.post(`/api/geosearch`, searchParams);
    if (response.data.length === 0) {
      setMapError('No listings found for the specified location.');
      setLoading(false);
      return;
    }
    // check if a listing belongs to the nitpicks and set listing.isFavorite accordingly
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
            onFavorite={
              async (listing) => {
                if (!userId) {
                  console.error('User not logged in!');
                  return;
                }
                try {
                  await toggleFavorite(listing, nitpicks, setNitpicks, userId, currentTeamId);
                } catch (error) {
                  console.error(error);
                }
              }
            }
            linkType="nitpick"
          />
        )),
    [listings, hoveredListingId, hoverTimeout]
  );

  // Now, inside the returned JSX, conditionally render your fallback UI.
  return (
    <div className={styles.container2col}>
      {(!isLoaded || loadError) ? (
        <div>
          {loadError ? "Error loading map" : "Loading Map..."}
        </div>
      ) : (
        <>
          {console.log("isLoaded:", isLoaded, "loadError:", loadError)}
          <div className={styles.searchContainer}>
            <header className={styles.searchHeader}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchRow}>
                  <Autocomplete
                    className={styles.searchHeader}
                    onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                    onPlaceChanged={() => {
                      if (autocomplete && typeof window.google !== 'undefined') {
                        const place = autocomplete.getPlace();
                        if (place.formatted_address) {
                          setAddress(place.formatted_address);
                        }
                        if (place.geometry?.location) {
                          const lat = place.geometry.location.lat();
                          const lng = place.geometry.location.lng();
                          setMapCenter({ lat, lng });
                          setMarkerPosition({ lat, lng });
                          // If you have a mapInstance, use it
                        }
                      }
                    }}
                  >
                    <input
                      placeholder="Enter US Address"
                      className={styles.searchInput}
                      value={address}
                      style={{ width: '100%' }}
                      onChange={(e) => {
                        setAddress(e.target.value);
                      }}
                    />
                  </Autocomplete>
                  <button
                    type="submit"
                    className={loading ? `${styles.searchButton} ${styles.loading}` : styles.searchButton}
                    disabled={loading}
                    ref={submitButtonRef}
                  >
                    {loading ? 'Processing...' : 'Search'}
                  </button>

                </div>
                <div className={styles.searchRow}>
                      <label>Radius (miles)</label>
                      <input
                        type="number"
                        min="0"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        placeholder="Set address first"
                      />
                </div>

              </form>
            </header>

            {/* Render the map container */}
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
              <div className={styles.errorBanner}>{mapError}</div>
            )}

            {/* Listings grid */}
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

          {/* Spinner overlay to indicate processing */}
          {loading && (
            <div className={styles.spinnerOverlay}>
              <FaSpinner className={styles.spinner} />
            </div>
          )}
        </>
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
