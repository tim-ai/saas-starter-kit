import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { XCircle } from 'lucide-react'; // Import the XCircle icon
import styles from './NitpickList.module.css';

export default function NitpickList({ nitpicks, hoveredListingId, setHoveredListingId, onDeleteFavorite }) {
  const router = useRouter();

  const handleClick = (address) => {
    router.push({
      pathname: '/nitpick',
      query: { address }
    });
  };

  // Delete the nitpick record by calling the API, then trigger parent's onDeleteFavorite if desired
  const handleDeleteFavorite = async (nitpickId, rid) => {
    try {
      
      const res = await fetch(`/api/nitpicks/${nitpickId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.error);
      }
      // No matter what call parent's deletion handler to update UI
      if (onDeleteFavorite) {
        onDeleteFavorite(rid);
      }

    } catch (error) {
      console.error('Failed to delete nitpick:', error);
    }
  };

  return (
    <div className={styles.listContainer}>
      {nitpicks.map((nitpick) => (
        <div
          key={nitpick.address}
          onMouseEnter={(e) => {
            setHoveredListingId(nitpick.id);
            const cardInner = e.currentTarget.querySelector(`.${styles.cardInner}`);
            if (cardInner) {
              cardInner.style.transform = 'rotateY(180deg)';
            }
          }}
          onMouseLeave={(e) => {
            setHoveredListingId(null);
            const cardInner = e.currentTarget.querySelector(`.${styles.cardInner}`);
            if (cardInner) {
              cardInner.style.transform = 'rotateY(0deg)';
            }
          }}
          onClick={() => 
            handleClick(nitpick.address)}
          className={`${styles.card} ${hoveredListingId === nitpick.id ? styles.highlighted : ''}`}
        >
          <div className={styles.cardInner}>
            <div className={`${styles.cardFace} ${styles.cardFront}`}>
              <img
                src={nitpick.image}
                alt={nitpick.address}
                className={styles.thumbnailImage}
              />
              <div className={styles.basicInfo}>
                <div className={styles.price}>
                  ${nitpick.price?.toLocaleString()}
                </div>
                <div className={styles.town}>{nitpick.town} ({nitpick.status})</div>
              </div>
            </div>
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
              <button
                className={styles.deleteMark}
                onClick={(e) => {
                  // log the nitpick ID and address
                  console.error('Deleting nitpick:', nitpick.nid, nitpick.id, nitpick.address);
                  e.stopPropagation();
                  // call delete function with realestate ID instead of nitpick ID
                  handleDeleteFavorite(nitpick.nid, nitpick.id);
                }}
              >
                <XCircle size={20} color="#ef4444" />
              </button>

              <h3>{nitpick.address}</h3>
              <p>
                {nitpick.town}, {nitpick.status}
              </p>
              <div className={styles.meta}>
                <span>{nitpick.beds} beds</span>
                <span>{nitpick.baths} baths</span>
                <span>{nitpick.sqft} sqft</span>
              </div>
              <p className={styles.timestamp}>
                Nitpicked on {new Date(nitpick.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

NitpickList.propTypes = {
  nitpicks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
      town: PropTypes.string,
      state: PropTypes.string,
      price: PropTypes.number,
      beds: PropTypes.number,
      baths: PropTypes.number,
      sqft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  hoveredListingId: PropTypes.string,
  setHoveredListingId: PropTypes.func.isRequired,
  onDeleteFavorite: PropTypes.func,
};
