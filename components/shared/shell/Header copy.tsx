import Link from 'next/link';
import React from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import useTheme from 'hooks/useTheme';
import env from '@/lib/env';
import { useTranslation } from 'next-i18next';
import { useCustomSignOut } from 'hooks/useCustomSignout';

interface HeaderProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// NavItem component using Next.js Link component
const NavItem = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 dark:text-gray-50 hover:bg-blue-100 transition-colors"
  >
    {label}
  </Link>
);

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const { toggleTheme } = useTheme();
  const { status, data } = useSession();
  const { t } = useTranslation('common');
  const signOut = useCustomSignOut();

  if (status === 'loading' || !data) {
    return null;
  }

  const { user } = data;

  return (
    <div
      className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b px-4 sm:gap-x-6 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'white', color: 'black' }}
    >
      {/* Mobile menu toggle button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-50 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">{t('open-sidebar')}</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      {/* Left Navigation items - always visible */}
      <nav className="flex space-x-4">
        <NavItem href="/search" label="Search" />
        <NavItem href="/nitpick" label="Nitpick" />
      </nav>
      
      {/* Spacer */}
      <div className="flex-1" />

      {/* Right User Menu */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        <div className="dropdown dropdown-end">
          <div className="flex items-center cursor-pointer" tabIndex={0}>
            <span className="flex items-center">
              <button
                className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-50"
                aria-hidden="true"
              >
                {user.name}
              </button>
              <ChevronDownIcon
                className="ml-2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 border rounded w-40 space-y-1"
          >
            <li
              onClick={() => {
                if (document.activeElement) {
                  (document.activeElement as HTMLElement).blur();
                }
              }}
            >
              <Link
                href="/settings/account"
                className="block px-2 py-1 text-sm leading-6 text-gray-900 dark:text-gray-50 cursor-pointer"
              >
                <div className="flex items-center">
                  <UserCircleIcon className="w-5 h-5 mr-1" /> {t('account')}
                </div>
              </Link>
            </li>
            {env.darkModeEnabled && (
              <li>
                <button
                  className="block px-2 py-1 text-sm leading-6 text-gray-900 dark:text-gray-50 cursor-pointer"
                  type="button"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center">
                    <SunIcon className="w-5 h-5 mr-1" /> {t('switch-theme')}
                  </div>
                </button>
              </li>
            )}
            <li>
              <button
                className="block px-2 py-1 text-sm leading-6 text-gray-900 dark:text-gray-50 cursor-pointer"
                type="button"
                onClick={signOut}
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1" /> {t('logout')}
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
