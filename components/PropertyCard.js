import styles from './PropertyCard.module.css';
import { FaBed, FaBath, FaExpand } from 'react-icons/fa';

export default function PropertyCard({ listing, imgHeight }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <div className={styles.propertyCard}>
      <a href={listing.url} target="_blank" rel="noopener noreferrer">
        <img src={listing.image} alt={listing.address} style={{ height: imgHeight }} />
      </a>
      <div className={styles.propertyDetails}>
        <a href={listing.url} target="_blank" rel="noopener noreferrer">
          <h3>{listing.address}</h3>
        </a>
        <div className={styles.price}>{formattedPrice}</div>
        <div className={styles.specs}>
          <span>
            <FaBed /> {listing.beds}
          </span>
          <span>
            <FaBath /> {listing.baths}
          </span>
          <span>
            <FaExpand /> {listing.sqft} sqft
          </span>
        </div>
      </div>
    </div>
  );
}
