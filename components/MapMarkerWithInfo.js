import { MarkerF, InfoBoxF } from '@react-google-maps/api';
import ActivePropertyCard from './ActivePropertyCard';
import { useRef } from 'react';

export default function MapMarkerWithInfo({
  listing,
  hoveredListingId,
  setHoveredListingId,
  hoverTimeout,
  setHoverTimeout,
  onFavorite,
  linkType = 'listing', // new input flag: "nitpick" or "listing"
}) {
  const isHovered = String(hoveredListingId) === String(listing.id);
  const isActive = listing.status.toLowerCase() === 'active' || listing.status.startsWith('FOR SALE');
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Helper to clear any pending hover timeout
  const clearHoverTimeout = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  // Schedules closing (i.e. unhover) after delay
  const scheduleClose = (delay = 400) => {
    
    const timeout = setTimeout(() => {
      if (!isHovered) return;
      setHoveredListingId(null);
    }, delay);
    setHoverTimeout(timeout);
  };

  const handleMarkerMouseOver = () => {
    clearHoverTimeout();
    setHoveredListingId(listing.id);
  };

  const handleMarkerMouseOut = () => {
    scheduleClose();
  };

  const handleInfoBoxMouseEnter = () => {
    clearHoverTimeout();
  };

  const handleInfoBoxMouseLeave = () => {
    scheduleClose();
  };

  const handleMarkerClick = () => {
    if (linkType === 'nitpick') {
      const url = `/nitpick?address=${encodeURIComponent(listing.address)}`;
      window.open(url, '_blank');
    } else {
      window.open(listing.url, '_blank');
    }
  };

  return (
    <>
      <MarkerF
        position={{ lat: listing._geo.lat, lng: listing._geo.lng }}
        key={listing.address}
        icon={
          isHovered
            ? {
                url: isActive
                  ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(35, 35),
              }
            : {
                url: isActive
                  ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(35, 35),
              }
        }
        onLoad={(markerInstance) => {
          markerRef.current = markerInstance;
        }}
        onUnmount={() => {
          markerRef.current = null;
        }}
        onMouseOver={handleMarkerMouseOver}
        onMouseOut={handleMarkerMouseOut}
        onClick={handleMarkerClick}
      />

      {isHovered && markerRef.current && (
        <InfoBoxF
          anchor={markerRef.current}
          options={{
            pixelOffset: new window.google.maps.Size(0, 20),
            disableAutoPan: true,
            closeBoxURL: '',
          }}
          onCloseClick={() => {
            setHoveredListingId(null);
            if (infoWindowRef.current) {
              infoWindowRef.current.setMap(null);
              infoWindowRef.current = null;
            }
          }}
          onLoad={(infoWindow) => {
            infoWindowRef.current = infoWindow;
          }}
          onMouseEnter={handleInfoBoxMouseEnter}
          onUnmount={() => {
            setHoveredListingId(null);
          }}
        >
          <div
            onMouseEnter={handleInfoBoxMouseEnter}
            onMouseLeave={handleInfoBoxMouseLeave}
            className="transition-opacity duration-300 ease-in-out"
            style={{
              width: '96%',
              height: '95%',
              padding: '0',
              marginBottom: '5px',
              backgroundColor: '#fff',
              display: 'block',
            }}
          >
            <ActivePropertyCard
              listing={listing}
              imgHeight="180px"
              highlighted
              onFavorite={onFavorite}
            />
          </div>
        </InfoBoxF>
      )}
    </>
  );
}