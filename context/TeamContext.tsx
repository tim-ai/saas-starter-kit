import { createContext, useContext } from 'react';

interface TeamContextType {
  currentTeamId: string | null;
  setCurrentTeamId: (teamId: string | null) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = TeamContext.Provider;

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}