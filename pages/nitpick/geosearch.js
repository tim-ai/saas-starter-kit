import { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Autocomplete, Circle } from '@react-google-maps/api';
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

  // State definitions
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
  const defaultRadius = "3.5";

  const [radius, setRadius] = useState(defaultRadius);
  const [address, setAddress] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  // New state for radio selection:
  const [showOption, setShowOption] = useState('showActive');
  const circleRef = useRef(null);
  const submitButtonRef = useRef(null);


  const currentTeamId = getCookie('currentTeamId');

  const mapContainerStyle = {
    width: '100%',
    height: '700px',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  // Update search term when query changes.
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

  // Set map center using geolocation when component mounts.
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

  // Scroll to hovered listing if needed.
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
    console.log('Search initiated with address:', address, " radius:", radius, " option:", showOption);

    if (typeof window.google === 'undefined') {
      setMapError('Google Maps API not loaded');
      setLoading(false);
      return;
    }

    if (!address.trim()) return;

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

    // Include status in the search parameters
    const searchParams = {
      lat: lat,
      lng: lng,
      radius: radius,
      showOption: showOption
    };

    try {
      const response = await axios.post(`/api/geosearch`, searchParams);
      if (response.data.length === 0) {
        setMapError('No listings found for the specified location.');
        setLoading(false);
        return;
      }
      // Mark listings as favorite if they belong in nitpicks.
      const listingsData = response.data.map((listing) => ({
        ...listing,
        isFavorite: nitpicks.some((nitpick) => nitpick.id === listing.id),
      }));

      setListings(listingsData);
      setZoom(12);
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
          <h1 className={styles.searchTitle}>Find listings within a radius of any address</h1>
        </div>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Autocomplete
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
                }
              }
            }}
          >
            <div className={styles.searchRow}>
              <input
                placeholder="Enter US Address"
                className={styles.searchInput}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <button
                type="submit"
                className={loading ? `${styles.searchButton} ${styles.loading}` : styles.searchButton}
                disabled={loading}
                ref={submitButtonRef}
              >
                {loading ? <FaSpinner className={styles.spinnerIcon} /> : 'Search'}
              </button>
            </div>
          </Autocomplete>

          {address && (
            <div className={styles.searchRow}>
              <div className={styles.radiusControl}>
                <input
                  type="number"
                  min="0.1"
                  max = "200"
                  step="0.1"
                  value={radius}
                  defaultValue={defaultRadius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="Radius (miles)"
                  className={styles.radiusInput}
                />
              </div>
              <input
                type="radio"
                value="showActive"
                id="showActive"
                name="option"
                checked={showOption === 'showActive'}
                onChange={(e) => setShowOption(e.target.value)}
                placeholder="Any"
              />
              <label htmlFor="showActive">Show Active</label>
              <input
                type="radio"
                value="showAll"
                id="showAll"
                name="option"
                checked={showOption === 'showAll'}
                onChange={(e) => setShowOption(e.target.value)}
                placeholder="Any"
              />
              <label htmlFor="showAll">Show All</label>
            </div>
          )}
        </form>

        <div className={styles.mapContainer}>
          {!isMapLoaded && <div className={styles.mapLoading}>Loading map...</div>}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={zoom}
            center={mapCenter}
            options={{
              disableDefaultUI: true,
              gestureHandling: 'greedy'
            }}
            onLoad={() => setIsMapLoaded(true)}
            onError={handleMapError}
          >
            {markers}
            {markerPosition && (
              <Circle
                onLoad={(circle) => {
                  circleRef.current = circle;
                }}
                center={markerPosition}
                radius={radius ? parseFloat(radius) * 1609.34 : 0}
                options={{
                  strokeColor: "#4285F4",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "#4285F4",
                  fillOpacity: 0.2,
                  draggable: false, // disable dragging of the whole circle
                  editable: true,   // still enable the resize handles
                  zIndex: 1,
                }}
                onRadiusChanged={() => {
                  if (circleRef.current) {
                    const newRadius = circleRef.current.getRadius();
                    const newRadiusMiles = newRadius / 1609.34;
                    setRadius(newRadiusMiles.toFixed(1));
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>

        {mapError && <div className={styles.errorBanner}>{mapError}</div>}

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
      nitpicks,
    },
  };
}
