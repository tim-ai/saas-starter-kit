import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import styles from './ActivePropertyCard.module.css';

export default function ActivePropertyCard({ listing, imgHeight, highlighted }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

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

  // If listing.price is a number, format it; otherwise, just use it as is.
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
            width: '100%'
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
        <div className={styles.inspectOverlay} onClick={handleInspect}>
          <FaSearch className={styles.inspectIcon} />
        </div>
      )}
    </div>
  );
}