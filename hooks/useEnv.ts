import fetcher from '@/lib/fetcher';
import useSWR, { mutate } from 'swr';
import { ApiResponse } from 'types';

interface Env {
  mixpanel: {
    token: string;
  };
}

const useEnv = () => {
  const { data, error, isLoading } = useSWR<ApiResponse<Env>>(
    '/api/env',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    error,
    isLoading,
    env: data?.data,
  };
};

export default useEnv;
