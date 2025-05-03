import React from 'react';
import ActivePropertyCard from './ActivePropertyCard';
import styles from './ListingsGrid.module.css';

export default function ListingsGrid({ listings, hoveredListingId, setHoveredListingId }) {
  return (
    <div className={styles.listingsGrid}>
      {listings.map((listing) => (
        <div
          key={listing.id}
          id={`listing-${listing.id}`}
          className={styles.listingItem}
          onMouseEnter={() => setHoveredListingId(listing.id)}
          onMouseLeave={() => setHoveredListingId(null)}
        >
          <ActivePropertyCard 
            listing={listing} 
            imgHeight="280px" 
            highlighted={hoveredListingId === listing.id} 
          />
        </div>
      ))}
    </div>
  );
}