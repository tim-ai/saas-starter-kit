import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaSearch, FaHeart } from 'react-icons/fa';
import styles from './ActivePropertyCard.module.css';
import { getCookie } from 'cookies-next';

export default function ActivePropertyCard({ listing, imgHeight, highlighted, onFavorite }) {
  const router = useRouter();
  // Initialize favorited based on listing.isFavorite (or false if absent)
  const [favorited, setFavorited] = useState(!!listing.isFavorite);
  const [hovered, setHovered] = useState(false);

  const teamId = getCookie('currentTeamId');
  const handleInspect = () => {
    if (router.asPath.endsWith('/search')) {
      const urlWithQuery = `${window.location.origin}/nitpick?address=${encodeURIComponent(listing.address)}`;
      window.open(urlWithQuery, '_blank');
    } else {
      router.push({
        pathname: '/nitpick',
        query: { address: listing.address },
      });
    }
  };

  const handleFavorite = async (e) => {
    // Prevent the click from triggering the card's onClick event.
    e.stopPropagation();
    setFavorited((prev) => !prev);

    try {
      if (onFavorite) {
        // Call the passed-in callback and update the heart state based on response.
        await onFavorite(listing);
      } else {
        // Alternative: If no callback is provided, fallback to an API call.
        const res = await fetch('/api/nitpicks?teamId=' + teamId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ realEstateId: listing.id }),
        });
        if (res.ok) {
          setFavorited(true);
          console.log('Added to favorites');
        } else {
          console.error('Failed to add favorite');
        }
      }
    } catch (err) {
      console.error('Error adding favorite:', err);
    }
  };

  // Format listing.price if it's a number.
  const formattedPrice =
    typeof listing.price === 'number'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(listing.price)
      : listing.price;

  return (
    <div
      className={styles.propertyCard}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        height: `${imgHeight * 1.5}px`,
        border: highlighted ? '5px solid #6495ed' : 'none',
      }}
    >
      <a href={listing.url} target="_blank" rel="noopener noreferrer">
        <img
          src={listing.image}
          alt={listing.address}
          style={{
            height: imgHeight,
            objectFit: 'cover',
            margin: '0 auto',
            width: '100%',
          }}
        />
      </a>
      <div className={styles.propertyDetails}>
        <a href={listing.url} target="_blank" rel="noopener noreferrer">
          <h3>{listing.address}</h3>
        </a>
          <FaHeart
            className={styles.favoriteIcon}
            onClick={handleFavorite}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '28px',
              color: favorited ? '#EF4444' : '#ccc',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />
        <div className={styles.price}>{formattedPrice} <span className={styles.detailLabel}>  ({listing.status}) </span> </div>

      </div>
      {hovered && (
        <div className={styles.inspectOverlay}>
          {/* Favorite Heart Icon in the upper right corner */}
          <FaHeart
            className={styles.favoriteIcon}
            onClick={handleFavorite}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '28px',
              color: favorited ? '#EF4444' : '#ccc',
              cursor: 'pointer',
              zIndex: 10,
            }}
          />
          <FaSearch className={styles.inspectIcon} onClick={handleInspect} />
        </div>
      )}
    </div>
  );
}