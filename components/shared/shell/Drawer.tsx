import React from 'react';
//import TeamDropdown from '../TeamDropdown';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Brand from './Brand';
import Navigation from './Navigation';
import { useTranslation } from 'next-i18next';

interface DrawerProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Drawer = ({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }: DrawerProps) => {
  const { t } = useTranslation('common');

  const renderHeaderContent = () => (
    <div className="flex items-center">
      <Brand />
      <button
        type="button"
        className="p-2 rounded relative h-8 translate-x-[5px] translate-y-[12px] bg-gray-200"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="sr-only">Toggle collapse</span>
        {isCollapsed ? (
          <ChevronDownIcon className="h-4 w-4 text-blue" aria-hidden="true" />
        ) : (
          <ChevronUpIcon className="h-4 w-4 text-blue" aria-hidden="true" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600/80" />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">{t('close-sidebar')}</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-black px-6 pb-4">
                {renderHeaderContent()}
                {!isCollapsed && (
                  <>
                    {/* <TeamDropdown /> */}
                    <Navigation />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 px-6">
          {renderHeaderContent()}
          {!isCollapsed && (
            <>
              {/* <TeamDropdown /> */}
              <Navigation />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Drawer;
