import {
  RectangleStackIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';

const UserNavigation = ({ activePathname }: NavigationProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    // {
    //   name: t('search-it'),
    //   href: `/nitpick/search`,
    //   icon: MagnifyingGlassIcon,
    //   active: activePathname === `/nitpick/search`,
    // },
    // {
    //   name: t('nitpick-it'),
    //   href: `/nitpick`,
    //   icon: ShieldCheckIcon,
    //   active: activePathname === `/nitpick`,
    // },

    {
      name: t('account'),
      href: '/settings/account',
      icon: UserCircleIcon,
      active: activePathname === '/settings/account',
    },
    {
      name: t('security'),
      href: '/settings/security',
      icon: ShieldCheckIcon,
      active: activePathname === '/settings/security',
    },
    {
      name: t('all-teams'),
      href: '/teams',
      icon: RectangleStackIcon,
      active: activePathname === '/teams',
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default UserNavigation;
