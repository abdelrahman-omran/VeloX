import { useQuery } from '@tanstack/react-query';
import { getActivePrs } from '../api/client';

const PR_POLL_MS = 4000;

export function useActivePrs() {
  return useQuery({
    queryKey: ['prs', 'active'],
    queryFn: getActivePrs,
    refetchInterval: PR_POLL_MS,
    staleTime: 2000,
  });
}
