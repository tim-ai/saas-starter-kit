import fetcher from '@/lib/fetcher';
import type { TeamMember, User } from '@prisma/client';
import useSWR, { mutate } from 'swr';
import type { ApiError, ApiResponse } from 'types';

type TeamMemberWithUser = TeamMember & { user: User };

const useTeamMembers = (slug: string) => {
  const url = `/api/teams/${slug}/members`;

  const { data, error, isLoading } = useSWR<
    ApiResponse<TeamMemberWithUser[]>,
    ApiError
  >(`/api/teams/${slug}/members`, fetcher);

  const mutateTeamMembers = async () => {
    mutate(url);
  };

  return {
    isLoading,
    error,
    members: data?.data,
    mutateTeamMembers,
  };
};

export default useTeamMembers;
