import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import useTeams from 'hooks/useTeams';
import {
  ChevronUpDownIcon,
  FolderIcon,
  FolderPlusIcon,
  RectangleStackIcon,
  UserCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { maxLengthPolicies } from '@/lib/common';

interface TeamDropdownProps {
  onSelectTeam?: (teamId: string) => void;
  team: any;
}

const TeamDropdown: React.FC<TeamDropdownProps> = ({ onSelectTeam, team }) => {
  const router = useRouter();
  const { teams } = useTeams();
  const { data } = useSession();
  const { t } = useTranslation('common');
  const [currentTeam, setCurrentTeam] = useState<any>(team);

  const menus = [
    {
      id: 2,
      name: t('teams'),
      items: (teams || []).map((team) => ({
        id: team.id,
        name: team.name,
        href: `/teams/${team.slug}/settings`,
        icon: FolderIcon,
      })),
    },
    {
      id: 1,
      name: t('profile'),
      items: [
        {
          id: data?.user.id,
          name: data?.user?.name,
          href: '/settings/account',
          icon: UserCircleIcon,
        },
      ],
    },
    {
      id: 3,
      name: '',
      items: [
        {
          id: 'all-teams',
          name: t('all-teams'),
          href: '/teams',
          icon: RectangleStackIcon,
        },
        {
          id: 'new-team',
          name: t('new-team'),
          href: '/teams?newTeam=true',
          icon: FolderPlusIcon,
        },
        {
          id: 'all-products',
          name: t('all-products'),
          href: `/teams/${currentTeam?.slug}/products`,
          icon: CodeBracketIcon,
          active: true,
        },
      ],
    },
  ];

  return (
    <div className="dropdown w-full">
      <div
        tabIndex={0}
        className="border border-gray-300 dark:border-gray-600 flex h-10 items-center px-4 justify-between cursor-pointer rounded text-xs font-bold"
      >
        {currentTeam?.name ||
          data?.user?.name?.substring(0, maxLengthPolicies.nameShortDisplay)}{' '}
        <ChevronUpDownIcon className="w-5 h-5" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content dark:border-gray-600 p-2 shadow-md bg-base-100 w-full rounded border px-2"
      >
        {menus.map(({ id, name, items }) => (
          <React.Fragment key={id}>
            {name && (
              <li className="text-xs text-gray-500 py-1 px-2" key={`${id}-name`}>
                {name}
              </li>
            )}
            {items.map((item) => (
              <li
                key={`${id}-${item.id}`}
                onClick={() => {
                  if (document.activeElement) {
                    (document.activeElement as HTMLElement).blur();
                  }
                  // When clicking on team menu items (id === 2), update current team state and cookie.
                  if (id === 2 && onSelectTeam) {
                    onSelectTeam(item.id);
                    setCurrentTeam(
                      teams?.find((team) => team.id === item.id) || null
                    );

                  }
                }}
              >
                <Link href={item.href}>
                  <div className="flex hover:bg-gray-100 hover:dark:text-black focus:bg-gray-100 focus:outline-none py-2 px-2 rounded text-xs font-medium gap-2 items-center">
                    <item.icon className="w-5 h-5" /> {item.name}
                  </div>
                </Link>
              </li>
            ))}
            {name && <li className="divider m-0" key={`${id}-divider`} />}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default TeamDropdown;
