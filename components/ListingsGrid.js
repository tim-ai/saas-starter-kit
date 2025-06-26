import { useState, useMemo } from 'react';
import ActivePropertyCard from './ActivePropertyCard';
import styles from './ListingsGrid.module.css';

export default function ListingsGrid({
  listings,
  hoveredListingId,
  setHoveredListingId,
  onFavorite,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  userLocation = null
}) {
  const [sortCriteria, setSortCriteria] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortedListings = useMemo(() => {
    return [...listings].sort((a, b) => {
      let valueA, valueB;

      switch (sortCriteria) {
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;
        case 'updatedAt':
          valueA = new Date(a.updatedAt);
          valueB = new Date(b.updatedAt);
          break;
        case 'distance':
          // Only calculate distance if userLocation is provided
          if (userLocation && a.geo && b.geo) {
            valueA = calculateDistance(userLocation, a.geo);
            valueB = calculateDistance(userLocation, b.geo);
          } else {
            // Default to createdAt if distance can't be calculated
            valueA = new Date(a.createdAt);
            valueB = new Date(b.createdAt);
          }
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [listings, sortCriteria, sortOrder, userLocation]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={styles.container}>
      <div className={styles.sortingBar}>
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort by:</span>
          <div className={styles.sortOptions}>
            {['price', 'createdAt', 'updatedAt'].map(criteria => (
              <button
                key={criteria}
                className={`${styles.sortButton} ${sortCriteria === criteria ? styles.active : ''}`}
                onClick={() => setSortCriteria(criteria)}
              >
                {criteria === 'price' && 'Price'}
                {criteria === 'createdAt' && 'Date Added'}
                {criteria === 'updatedAt' && 'Date Updated'}
              </button>
            ))}
            {userLocation && (
              <button
                key="distance"
                className={`${styles.sortButton} ${sortCriteria === 'distance' ? styles.active : ''}`}
                onClick={() => setSortCriteria('distance')}
              >
                Distance
              </button>
            )}
          </div>
          <button
            className={styles.orderToggle}
            onClick={toggleSortOrder}
            aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className={styles.listingsGrid}>
        {sortedListings.map((listing) => (
          <div
            key={listing.id}
            id={`listing-${listing.id}`}
            className={`${styles.listingItem} ${selectable ? styles.selectable : ''}`}
            onMouseEnter={() => setHoveredListingId(listing.id)}
            onMouseLeave={() => setHoveredListingId(null)}
          >
            {selectable && (
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(listing.id)}
                  onChange={() => onSelectionChange(listing.id)}
                  className={styles.listingCheckbox}
                />
              </div>
            )}
            <ActivePropertyCard
              listing={listing}
              imgHeight="280px"
              highlighted={hoveredListingId === listing.id}
              onFavorite={onFavorite}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to calculate distance between two coordinates
function calculateDistance(coords1, coords2) {
  if (!coords1 || !coords2) return Infinity;
  
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
