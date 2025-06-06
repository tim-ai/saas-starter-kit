import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './compare.module.css';
import FavoritePropertyCard from '@/components/FavoritePropertyCard';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSession } from 'next-auth/react';
import { getCookie } from 'cookies-next';
import { FaSpinner } from 'react-icons/fa';

import { toggleFavorite } from '@/lib/favorite';

export default function ComparePage({ nitpicks: serverNitpicks }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || null;
  const currentTeamId = getCookie('currentTeamId');
  
  const [favorites, setFavorites] = useState(serverNitpicks || []);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toggle item selection
  const toggleSelection = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Start comparison
  const handleCompare = () => {
    setShowComparison(true);
  };

  // Close comparison view
  const handleCloseComparison = () => {
    setShowComparison(false);
    setSelectedItems([]);
  };

  // Handle favorite toggle
  const handleFavorite = async (listing) => {
    if (!userId) return;
    setLoading(true);
    try {
      await toggleFavorite(listing, favorites, setFavorites, userId, currentTeamId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected listings for comparison
  const selectedListings = favorites.filter(item =>
    selectedItems.includes(item.id)
  );

  return (
    <div className={styles.favoritesContainer}>
      <div className={styles.headerRow}>
        <h1>Your Favorite Listings</h1>
        {!showComparison && selectedItems.length > 0 && (
          <button
            className={styles.compareButton}
            onClick={handleCompare}
          >
            Start Comparing ({selectedItems.length})
          </button>
        )}
        {showComparison && (
          <button
            className={styles.closeButton}
            onClick={handleCloseComparison}
          >
            Close Comparison
          </button>
        )}
      </div>

      {showComparison ? (
        <div className={styles.comparisonContainer}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Property</th>
                {selectedListings.map(listing => (
                  <th key={listing.id}>
                    <div>{listing.address}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Thumbnail</td>
                {selectedListings.map(listing => (
                  <td key={listing.id} style={{ textAlign: 'center' }}>
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className={styles.thumbnail}
                      style= {{ display: 'inline-block', width: '100px', height: 'auto' }}
                    />
                  </td>   
                ))}
              </tr>
              <tr>
                <td>Price</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>${listing.price.toLocaleString()}</td>
                ))}
              </tr>
              
              <tr>
                <td>Sq. Ft.</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.sqft.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td>Public Facts</td>
                {selectedListings.map(listing => {
                  // Extract public facts total sqft (assumes it is numeric or a string that can be parsed)
                  const publicSqft = listing.extraInfo?.[0].value?.public_facts?.total_sqft;
                  // Convert listing.sqft to a number (if not already) and parse public facts sqft
                  const listingSqft = typeof listing.sqft === 'number'
                    ? listing.sqft
                    : parseFloat(listing.sqft);
                  const publicSqftValue = publicSqft ? parseFloat(publicSqft) : null;
                  // Determine if the values mismatch
                  const isMismatch = publicSqftValue !== null && publicSqftValue !== listingSqft;
                  return (
                    <td
                      key={listing.id}
                      style={{ color: isMismatch ? 'red' : 'inherit' }}
                    >
                      {publicSqft}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>Year Built</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.year_built}</td>
                ))}
              </tr>
              <tr>
                <td>Status</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.status}</td>
                ))}
              </tr>
              <tr>
                <td>Beds</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.beds}</td>
                ))}
              </tr>
              <tr>
                <td>Baths</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.baths}</td>
                ))}
              </tr>
              <tr>
                <td>Garage</td>
                {selectedListings.map(listing => (
                  <td key={listing.id}>{listing.garage}</td>
                ))}
              </tr>
              <tr>
                <td>Heating</td>
                {selectedListings.map(listing => {
                  return (
                    <td key={listing.id}>{listing.extraInfo?.[0].value.heating?.energy_source} {listing.extraInfo?.[0].value.heating?.delivery_method}</td>
                  )
                })}
              </tr>
              <tr>
                <td>Cooling</td>
                {selectedListings.map(listing => {
                  return (
                    <td key={listing.id}>{listing.extraInfo?.[0].value.cooling?.energy_source} {listing.extraInfo?.[0].value.cooling?.delivery_method}</td>
                  )
                })}
              </tr>
              <tr>
                <td>Sewage</td>
                {selectedListings.map(listing => {
                  return (
                    <td key={listing.id}>{listing.extraInfo?.[0].value.sewage?.type}</td>
                  )
                })}
              </tr>
              <tr>
                <td>Water</td>
                {selectedListings.map(listing => {
                  return (
                    <td key={listing.id}>{listing.extraInfo?.[0].value.water?.type}</td>
                  )
                })}
              </tr>
              <tr>
                <td>Stove</td>
                {selectedListings.map(listing => {
                  return (
                    <td key={listing.id}>{listing.extraInfo?.[0].value.stove?.energy_source}</td>
                  )
                })}
              </tr>
                           {/*
                Added below: Iterate through listing issues grouped by area.
                Each row corresponds to one issue area; for each listing, we show details for that area if present.
              */}
              {(() => {
                // Group issues by area across all selected listings
                const issueGroups = {};
                selectedListings.forEach(listing => {
                  if (listing.issues && Array.isArray(listing.issues)) {
                    listing.issues.forEach(issue => {
                      if (!issue.area) return; // skip if area is not defined
                      if (!issueGroups[issue.area]) {
                        issueGroups[issue.area] = {};
                      }
                      // If multiple issues are present for a listing in the same area, you can adjust here (currently using first encountered)
                      if (!issueGroups[issue.area][listing.id]) {
                        issueGroups[issue.area][listing.id] = issue;
                      }
                    });
                  }
                });
                return Object.entries(issueGroups).map(([area, issuesByListing]) => (
                  <tr key={area}>
                    <td>{area}</td>
                    {selectedListings.map(listing => (
                      <td key={listing.id}>
                        {issuesByListing[listing.id] ? (
                          <div>
                            <div>{issuesByListing[listing.id].problem}</div>
                            {/* <div>{issuesByListing[listing.id].severity}</div>
                            <div>{issuesByListing[listing.id].impact}</div> */}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.gridContainer}>
          {favorites.map((listing) => (
            <FavoritePropertyCard
              key={listing.id}
              listing={listing}
              isFavorite={true}
              onFavoriteToggle={() => handleFavorite(listing)}
              isSelected={selectedItems.includes(listing.id)}
              onSelect={() => toggleSelection(listing.id)}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className={styles.spinnerOverlay}>
          <FaSpinner className={styles.spinner} />
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;

  const historyResponse = await fetch(`${protocol}://${host}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: context.req.headers.cookie || '',
    },
  });

  let data = [];
  if (historyResponse.ok) {
    data = await historyResponse.json();
  }

  const { transformNitpick } = require('@/lib/nitpick');
  const nitpicks = data.map(transformNitpick);
  const { locale } = context;
  
  return {
    props: { 
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      nitpicks 
    },
  };
}