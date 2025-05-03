import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import styles from './NitpickList.module.css';

export default function NitpickList({ nitpicks, hoveredListingId, setHoveredListingId }) {
  const router = useRouter();

  const handleClick = (address) => {
    router.push({
      pathname: '/nitpick',
      query: { address }
    });
  };

  return (
    <div className={styles.listContainer}>
      {nitpicks.map((nitpick) => (
        <div
          key={nitpick.address}
          onMouseEnter={(e) => {
            setHoveredListingId(nitpick.id);
            // Find the cardInner element within this card
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
          onClick={() => handleClick(nitpick.address)}
          className={`${styles.card} ${hoveredListingId === nitpick.id ? styles.highlighted : ''}`}
        >
          
          <div className={styles.cardInner}>
            {/* Front side (default view) */}
            <div className={styles.cardFace + " " + styles.cardFront}>
              <img
                src={nitpick.image}
                alt={nitpick.address}
                className={styles.thumbnailImage}
              />
              <div className={styles.basicInfo}>
                <div className={styles.price}>
                  ${nitpick.price?.toLocaleString()}
                </div>
                <div className={styles.town}>{nitpick.town}</div>
              </div>
            </div>
            {/* Back side (hover view) */}
            <div className={styles.cardFace + " " + styles.cardBack}>
              <h3>{nitpick.address}</h3>
              <p>
                {nitpick.town}, {nitpick.state}
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
};
