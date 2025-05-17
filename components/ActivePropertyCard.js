import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaSearch, FaHeart } from 'react-icons/fa';
import styles from './ActivePropertyCard.module.css';

export default function ActivePropertyCard({ listing, imgHeight, highlighted }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [favorited, setFavorited] = useState(false);

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
    try {
      const res = await fetch('/api/nitpicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Adjust the property used for the real estate identifier as needed.
        body: JSON.stringify({ realEstateId: listing.id }),
      });
      if (res.ok) {
        setFavorited(true);
        console.log('Added to favorites');
      } else {
        console.error('Failed to add favorite');
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
        <div className={styles.price}>{formattedPrice}</div>
      </div>
      {hovered && (
        <div className={styles.inspectOverlay}>
          <FaHeart
            className={styles.favoriteIcon}
            onClick={handleFavorite}
            style={{ color: favorited ? '#EF4444' : '#ccc', marginRight: '8px', cursor: 'pointer' }}
          />
          <FaSearch className={styles.inspectIcon} onClick={handleInspect} />
        </div>
      )}
    </div>
  );
}