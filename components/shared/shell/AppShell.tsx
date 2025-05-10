import { Loading } from '@/components/shared';
import { useSession } from 'next-auth/react';
import React from 'react';
import Header from './Header';
import { useRouter } from 'next/router';

// import Drawer from './Drawer';
//import { useRouter } from 'next/navigation';

export default function AppShell({ children }) {
  const router = useRouter();
  const { status } = useSession();

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return;
  }
  //const isGuest = status === 'unauthenticated';

  return (
    <div>
      {/* <Drawer isCollapsed={isCollapsed} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setIsCollapsed={setIsCollapsed} />  */}
      <div className="lg:pl-1">
        <Header/>
        <main className="py-5">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

