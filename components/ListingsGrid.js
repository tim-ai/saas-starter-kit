import ActivePropertyCard from './ActivePropertyCard';
import styles from './ListingsGrid.module.css';

export default function ListingsGrid({
  listings,
  hoveredListingId,
  setHoveredListingId,
  onFavorite,
  selectable = false,
  selectedItems = [],
  onSelectionChange
}) {
  return (
    <div className={styles.listingsGrid}>
      {listings.map((listing) => (
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
  );
}
