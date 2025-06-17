import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Autocomplete, Marker } from '@react-google-maps/api';
import HouseListingCard from '../../components/HouseListingCard'; // <-- Updated import
import NitpickList from '../../components/NitpickList';
import styles from './index.module.css';
import { transformNitpick } from '@/lib/nitpick';
import { toggleFavorite } from '@/lib/favorite';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSession } from 'next-auth/react';
import { getCookie } from 'cookies-next';


const mapContainerStyle = {
  width: '100%',
  height: '500px',
  margin: '12px auto',
  fontSize: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

export default function NitPicker({ nitpicks: serverNitpicks }) {
  const router = useRouter();
  const { address: queryAddress } = router.query;
  const [address, setAddress] = useState('');
  const [hasPropertyMeta, setHasPropertyMeta] = useState(false);
  const [propertyMeta, setPropertyMeta] = useState(null);
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(false);
  const [nitpicks, setNitpicks] = useState(serverNitpicks || []);
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 42.3601, lng: -71.0589 });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [hoveredListingId, setHoveredListingId] = useState(null);

  const currentTeamId = getCookie('currentTeamId') || null;
  const submitButtonRef = useRef(null);
  const { data: session } = useSession();
  const userId = session?.user?.id || null;

  // Update address when query param changes so the input reflects it.
  useEffect(() => {
    if (queryAddress) {
      setAddress(queryAddress);
      setTimeout(() => {
        if (submitButtonRef.current) {
          submitButtonRef.current.click();
        }
      }, 100);
    }
  }, [queryAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    let hasReset = false;
    try {
      let place;
      if (autocomplete) {
        place = autocomplete.getPlace();
        if (!place || !place.geometry) {
          const service = new window.google.maps.places.AutocompleteService();
          const predictions = await new Promise((resolve, reject) => {
            service.getPlacePredictions({ input: address }, (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(predictions);
              } else {
                reject(status);
              }
            });
          });
          if (predictions && predictions.length > 0) {
            const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
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
      
      if (place && place.geometry) {
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        if (mapInstance) {
          mapInstance.panTo({ lat, lng });
        }
      }

      // Submit nitpicking request...
      const abortController = new AbortController();
      const lat = markerPosition?.lat || "";
      const lng = markerPosition?.lng || "";
      const response = await fetch(`/api/nitpick?lat=${lat}&lng=${lng}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'entity-id': userId || '',
          'entity-type': 'user',
          'resource-type': 'views'
        },
        body: JSON.stringify({ address }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        setMapError(errorMsg);
        setLoading(false);
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              try {
                const data = JSON.parse(buffer);
                if (data.type === 'information' && data.source === 'property_meta') {
                  const meta = {
                    ...data.value,
                    isFavorite: nitpicks.some((nitpick) => nitpick.id === data.value.id),
                  };
                  setHasPropertyMeta(true);
                  setPropertyMeta(meta);
                } else if (data.type === 'issue') {
                  data.comments = [];
                  if (!hasReset) {
                    setSections({ [data.area]: [data] });
                    hasReset = true;
                  } else {
                    setSections((prev) => ({
                      ...prev,
                      [data.area]: [...(prev[data.area] || []), data],
                    }));
                  }
                }
              } catch (error) {
                console.error('Error processing final chunk:', error);
              }
            }
            break;
          }
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.trim() === '') continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'information' && data.source === 'property_meta') {
                const meta = {
                  ...data.value,
                  isFavorite: nitpicks.some((nitpick) => nitpick.id === data.value.id),
                };
                setHasPropertyMeta(true);
                setPropertyMeta(meta);
              } else if (data.type === 'issue') {
                if (!hasReset) {
                  setSections({ [data.area]: [data] });
                  hasReset = true;
                } else {
                  setSections((prev) => ({
                    ...prev,
                    [data.area]: [...(prev[data.area] || []), data],
                  }));
                }
              } else if (data.type === 'end') {
                setLoading(false);
              }
            } catch (error) {
              console.error('Error processing line:', error, 'Raw:', line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container2col}>
      <div className="max-w-5xl w-full mx-auto bg-white shadow-xl rounded-lg my-8 font-sans relative">
        <div name="searchHeader">
          <form onSubmit={handleSubmit} className={styles.searchFormRow}>
            <Autocomplete
              className={styles.searchHeader}
              onLoad={(autocomplete) => setAutocomplete(autocomplete)}
              onPlaceChanged={() => {
                if (autocomplete) {
                  const place = autocomplete.getPlace();
                  if (place.formatted_address) {
                    setAddress(place.formatted_address);
                  }
                  if (place.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setMapCenter({ lat, lng });
                    setMarkerPosition({ lat, lng });
                    if (mapInstance) {
                      mapInstance.panTo({ lat, lng });
                    }
                  }
                }
              }}
            >
              <input
                placeholder="Enter US Address"
                className={styles.searchInput}
                value={address}
                style={{ width: '100%' }}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Autocomplete>
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={loading}
              ref={submitButtonRef}
            >
              {loading ? 'Processing...' : 'Nitpick It!'}
            </button>
          </form>
        </div>

        {/*
          If propertyMeta has been updated with actual property data, display HouseListingCard.
          Otherwise, keep displaying the map container.
        */}
        {propertyMeta ? (
          <HouseListingCard 
            listingData={propertyMeta} 
            sections={sections} 
            setSections={setSections}
            currentUser={userId} 
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
        ) : (
          <div className={styles.mapContainer}>
            <div className={styles.mapWrapper}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={mapCenter}
                options={{ disableDefaultUI: true }}
                onLoad={(map) => setMapInstance(map)}
              >
                {markerPosition && (
                  <Marker
                    position={markerPosition}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          </div>
        )}

        {!mapError && !propertyMeta && (
          <div className={styles.infoMessage}></div>
        )}

        {mapError && (
          <div className={styles.errorMessage}>
            {mapError}
            <button
              onClick={() => {
                setMapError(null);
                setAddress('');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded ml-4"
            >
              Return
            </button>
          </div>
        )}
      </div>

      {nitpicks.length > 0 && (
        <div className={styles.savedSection}>
          <h2 className={styles.savedTitle}>Your Saved Listings</h2>
          <NitpickList
            nitpicks={nitpicks} 
            hoveredListingId={hoveredListingId}
            setHoveredListingId={setHoveredListingId}
            onDeleteFavorite={(rid) => {
              setNitpicks((prev) => prev.filter((listing) => listing.id !== rid));
            }}
          />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const teamId = context.req.cookies.currentTeamId;
  
  const historyResponse = await fetch(`${protocol}://${host}/api/history?team=${teamId}`, {
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
  
  const nitpicks = data.map(transformNitpick);
  const { locale } = context;
  return {
    props: { 
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      nitpicks 
    },
  };
}