import { useQuery } from '@tanstack/react-query';
import { getSprintHealth } from '../api/client';

const SPRINT_POLL_MS = 15000;

export function useSprintHealth() {
  return useQuery({
    queryKey: ['sprint', 'health'],
    queryFn: getSprintHealth,
    refetchInterval: SPRINT_POLL_MS,
    staleTime: 10_000,
  });
}
