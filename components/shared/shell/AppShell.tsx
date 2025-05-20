import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Loading } from '@/components/shared';
import Header from './Header';
import { TeamProvider } from 'context/TeamContext';

export default function AppShell({ children }) {
  const router = useRouter();
  const { status } = useSession();
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  if (status === 'loading') {
    return <Loading />;
  }
  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <TeamProvider value={{ currentTeamId, setCurrentTeamId }}>
      <div className="lg:pl-1">
        <Header currentTeamId={currentTeamId} setCurrentTeamId={setCurrentTeamId} />
        <main className="py-5">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </TeamProvider>
  );
}

