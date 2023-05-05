import fetcher from '@/lib/fetcher';
import type { Team } from '@prisma/client';
import useSWR from 'swr';
import type { ApiError, ApiResponse } from 'types';

const useTeam = (slug: string | undefined) => {
  const { data, error, isLoading } = useSWR<ApiResponse<Team>, ApiError>(
    slug ? `/api/teams/${slug}` : null,
    fetcher
  );

  return {
    isLoading,
    error,
    team: data?.data,
  };
};

export default useTeam;
