import { useEffect, useState } from 'react';

/** Show loading UI only after `delayMs` to avoid spinner flash. */
export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return show;
}
