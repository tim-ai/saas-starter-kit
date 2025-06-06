import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import useTheme from 'hooks/useTheme';
import env from '@/lib/env';
import { useTranslation } from 'next-i18next';
import { useCustomSignOut } from 'hooks/useCustomSignout';
import TeamDropdown from '@/components/shared/TeamDropdown';
import UserNavigation from '@/components/shared/shell/UserNavigation';
import styles from './Header.module.css';
import useTeams from 'hooks/useTeams';
import { getCookie, setCookie } from 'cookies-next';
import { useRouter } from 'next/router'; 

const Header = () => {
  const { toggleTheme } = useTheme();
  const { status, data } = useSession();
  const { t } = useTranslation('common');
  const signOut = useCustomSignOut();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  let dropdownTimeout: NodeJS.Timeout;

  const { teams } = useTeams();
  const router = useRouter();
  const [currentTeam, setCurrentTeam] = useState<any>(null);

  const handleSelectTeam = useCallback((teamId: string) => {
    setCookie('currentTeamId', teamId, { maxAge: 60 * 60 * 24 * 1 });
  }, []);

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
    }
    setDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeout = setTimeout(() => {
      setDropdownOpen(false);
    }, 300); // 300ms delay
  };

  useEffect(() => {
    const cookieTeamId = getCookie('currentTeamId');
    if (cookieTeamId && teams && teams.length > 0) {
      const teamFromCookie = teams.find((team) => team.id === cookieTeamId);
      if (teamFromCookie) {
        setCurrentTeam(teamFromCookie);
        return;
      }
    }
  
    // If no cookie or team not found, set the first team as current when no slug is present
    if (teams && teams.length > 0 && !router.query.slug) {
      setCurrentTeam(teams[0]);
      setCookie('currentTeamId', teams[0].id, { maxAge: 60 * 60 * 24 * 1 });
      return;
    }


    if (teams && teams.length > 0) {
      const teamFromQuery = teams.find((team) => team.slug === router.query.slug);
      if (teamFromQuery) {
        setCurrentTeam(teamFromQuery);
        setCookie('currentTeamId', teamFromQuery.id, { maxAge: 60 * 60 * 24 * 1 });
      } else {
        setCurrentTeam(teams[0]);
        setCookie('currentTeamId', teams[0].id, { maxAge: 60 * 60 * 24 * 1 });
      }
    }
  }, [teams, router.query.slug]);

  if (status === 'loading' || !data) return null;
  const { user } = data;
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.inner}>
          {/* Logo wrapped in anchor linking to https://nitpickr.net */}
          <Link href="/">
            <svg width="230" height="50" viewBox="0 0 230 50" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke="#6B7280" strokeWidth="2.5">
                <circle cx="25" cy="25" r="10"/>
                <line x1="32" y1="32" x2="40" y2="40"/>
              </g>
              <text 
                x="55" 
                y="32" 
                fontFamily="Montserrat, Arial, sans-serif" 
                fontSize="18" 
                fontWeight="800" 
                fill="#374151" 
              > 
                NITPICKR<tspan fill="#4B5563">.NET</tspan> 
              </text>
            </svg>
          </Link>

          <nav className={styles.nav}>
            <Link href="/nitpick/search" className={styles.navItem}>
              {t('Search')}
            </Link>
            <Link href="/nitpick" className={styles.navItem}>
              {t('Nitpick')}
            </Link>
          </nav>

          <div className="flex items-center">
            <div
              className={styles.dropdown}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <button className={styles.userButton}>
                <UserCircleIcon className="h-6 w-6 mr-1" />
                {user.name}
                <ChevronDownIcon className="h-5 w-5 ml-1 text-gray-500" />
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownSection}>
                    <h4 className={styles.dropdownTitle}>
                      {t('User Settings')}
                    </h4>
                    <div className="text-sm">
                      <UserNavigation activePathname={''} />
                    </div>
                  </div>
                  <div className={styles.dropdownSection}>
                    <h4 className={styles.dropdownTitle}>
                      {t('Team')}
                    </h4>
                    <TeamDropdown onSelectTeam={handleSelectTeam} team={currentTeam} />
                  </div>
                  <div className={styles.dropdownSection}>
                    {env.darkModeEnabled && (
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={toggleTheme}
                      >
                        <SunIcon className="w-5 h-5 mr-2" />
                        {t('Switch Theme')}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={signOut}
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                      {t('Logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
