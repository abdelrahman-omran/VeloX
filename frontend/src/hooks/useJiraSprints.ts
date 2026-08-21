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