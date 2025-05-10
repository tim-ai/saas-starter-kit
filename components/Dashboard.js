import { useEffect, useRef } from 'react';
import styles from './Dashboard.module.css';

export default function Dashboard({ sections, currentHighlights, setCurrentHighlights, handleThumb }) {
  const dashboardRef = useRef(null);

  useEffect(() => {
    // When sections update, scroll the dashboard container to the bottom
    if (dashboardRef.current) {
      dashboardRef.current.scrollTop = dashboardRef.current.scrollHeight;
    }
  }, [sections]);

  const handleHighlight = (highlight, isEnter) => {
    setCurrentHighlights(prev => {
      const newSet = new Set(prev);
      if (isEnter) {
        newSet.add(highlight);
      } else {
        newSet.delete(highlight);
      }
      return newSet;
    });
  };

  return (
    <div ref={dashboardRef} className={styles.dashboard}>
      {Object.entries(sections).map(([area, issues]) => (
        <div key={area} className={styles.section}>
          <h3 className={styles.sectionTitle}>{area}</h3>
          <div className={styles.issuesGrid}>
            {issues.map((issue, index) => (
              <div
                key={index}
                data-issue-id={`issue-${area}-${index}`}
                className={`${styles.issueCard} ${
                  currentHighlights.has(issue.highlight) ? styles.highlightedCard : ''
                }`}
                onMouseEnter={() => handleHighlight(issue.highlight, true)}
                onMouseLeave={() => handleHighlight(issue.highlight, false)}
              >
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.severityIndicator} ${
                      issue.severity === 'high' ? styles.highSeverity :
                      issue.severity === 'medium' ? styles.mediumSeverity :
                      styles.lowSeverity
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <div className={styles.actions}>
                    <button onClick={() => handleThumb(issue, true)} className={styles.thumbButton}>
                      👍
                    </button>
                    <button onClick={() => handleThumb(issue, false)} className={styles.thumbButton}>
                      👎
                    </button>
                  </div>
                </div>
                <h4 className={styles.problemTitle}>{issue.problem}</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Impact:</span>
                    <span className={styles.detailValue}>{issue.impact}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Source:</span>
                    <span className={styles.detailValue}>{issue.source}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.recommendationLabel}>Recommendation:</span>
                    <span className={styles.recommendationValue}>{issue.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}