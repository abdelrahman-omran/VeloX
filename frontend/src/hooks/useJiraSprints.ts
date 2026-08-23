import { useEffect, useState } from 'react';
import { getJiraSprints } from '../api/client';
import type { JiraSprint } from '../schemas/jira';

export function useJiraSprints() {
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJiraSprints();
      setSprints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Jira sprints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSprints();
  }, []);

  return { sprints, isLoading, error, refetch: fetchSprints };
}

// Single sprint fetcher needed for the details page
export function useJiraSprint(sprintId: string | undefined) {
  const [sprint, setSprint] = useState<JiraSprint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprint = async () => {
    if (!sprintId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJiraSprints();
      const found = data.find((s) => String(s.id) === String(sprintId));
      if (!found) throw new Error('Sprint not found');
      
      setSprint(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Jira sprint details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSprint();
  }, [sprintId]);

  return { sprint, isLoading, error, refetch: fetchSprint };
}