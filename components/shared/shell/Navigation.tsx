import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TeamNavigation from './TeamNavigation';
import UserNavigation from './UserNavigation';

const Navigation = () => {
  const { asPath, isReady, query } = useRouter();
  const [activePathname, setActivePathname] = useState<null | string>(null);
  const { slug } = query as { slug: string };

  useEffect(() => {
    if (isReady && asPath) {
      const activePathname = new URL(asPath, location.href).pathname;
      setActivePathname(activePathname);
    }
  }, [asPath, isReady]);

  const NavigationContent = () => {
    if (slug) {
      return <TeamNavigation activePathname={activePathname} slug={slug} />;
    } else {
      return <UserNavigation activePathname={activePathname} />;
    }
  };

  return (
    <nav className="flex flex-col transition-all duration-300 w-64">
      <div className="flex-1 overflow-auto">
        <NavigationContent />
      </div>
    </nav>
  );
};

export default Navigation;
