import React from 'react';
import styles from './ComparisonTable.module.css';

export default function ComparisonTable({ listings }) {
  if (listings.length === 0) return null;

  return (
    <div className={styles.comparisonTable}>
      <table>
        <thead>
          <tr>
            <th></th>
            {listings.map((listing) => (
              <th key={listing.id}>
                <div className={styles.listingHeader}>
                  <div className={styles.title}>{listing.title}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.attribute}>thumbnail</td>
              {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                 <img 
                    src={listing.thumbnail} 
                    alt={listing.title} 
                    className={styles.thumbnail}
                  />
              </td>
            ))}
                 
          </tr>
          <tr>
            <td className={styles.attribute}>Price</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.price}
              </td>
            ))}
          </tr>
          <tr>
            <td className={styles.attribute}>Bedrooms</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.bedrooms}
              </td>
            ))}
          </tr>
          <tr>
            <td className={styles.attribute}>Bathrooms</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.bathrooms}
              </td>
            ))}
          </tr>
          <tr>
            <td className={styles.attribute}>Sq Ft</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.sqft}
              </td>
            ))}
          </tr>
          <tr>
            <td className={styles.attribute}>Year Built</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.yearBuilt}
              </td>
            ))}
          </tr>
          <tr>
            <td className={styles.attribute}>Location</td>
            {listings.map((listing) => (
              <td key={listing.id} className={styles.value}>
                {listing.address}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}