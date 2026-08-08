import { useEffect, useMemo, useRef, useState } from 'react';
import { sortPrsByRisk } from './lib/risk';
import { useActivePrs } from './hooks/useActivePrs';
import { useDelayedFlag } from './hooks/useDelayedFlag';
import { useSprintHealth } from './hooks/useSprintHealth';
import { AppShell } from './components/layout/AppShell';
import { PrQueue } from './components/queue/PrQueue';
import { PrDetail } from './components/detail/PrDetail';
import { Alert } from './components/ui/Alert';

export default function App() {
  const prsQuery = useActivePrs();
  const sprintQuery = useSprintHealth();

  const sorted = useMemo(
    () => sortPrsByRisk(prsQuery.data ?? []),
    [prsQuery.data],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string> | null>(null);

  const showPrSkeleton = useDelayedFlag(prsQuery.isLoading && !prsQuery.data);
  const showSprintSkeleton = useDelayedFlag(sprintQuery.isLoading && !sprintQuery.data);

  useEffect(() => {
    if (sorted.length === 0) return;

    const ids = new Set(sorted.map((p) => p.id));
    if (seenIdsRef.current === null) {
      seenIdsRef.current = ids;
      return;
    }

    const newcomers = sorted.filter(
      (p) => !seenIdsRef.current!.has(p.id) && p.risk_level === 'high',
    );
    if (newcomers.length > 0) {
      setHighlightedIds(new Set(newcomers.map((p) => p.id)));
      const timer = window.setTimeout(() => setHighlightedIds(new Set()), 2000);
      seenIdsRef.current = ids;
      return () => window.clearTimeout(timer);
    }

    seenIdsRef.current = ids;
  }, [sorted]);

  useEffect(() => {
    if (selectedId && sorted.some((p) => p.id === selectedId)) return;
    const preferred =
      sorted.find((p) => p.risk_level === 'high' || (p.risk_score ?? 0) >= 8) ??
      sorted[0];
    setSelectedId(preferred?.id ?? null);
  }, [sorted, selectedId]);

  useEffect(() => {
    if (prsQuery.isError || sprintQuery.isError) {
      setDismissedError(false);
    }
  }, [prsQuery.isError, sprintQuery.isError]);

  const selected = sorted.find((p) => p.id === selectedId) ?? null;
  const repoName =
    selected?.repo_full_name ??
    sorted[0]?.repo_full_name ??
    'example/acme-payments';

  const errorMessage =
    (prsQuery.error instanceof Error && prsQuery.error.message) ||
    (sprintQuery.error instanceof Error && sprintQuery.error.message) ||
    null;

  return (
    <AppShell
      sprintHealth={sprintQuery.data}
      sprintLoading={sprintQuery.isLoading}
      showSprintSkeleton={showSprintSkeleton}
      repoName={repoName}
      syncLabel={import.meta.env.VITE_USE_FIXTURES === 'false' ? 'Live' : 'Fixtures'}
    >
      {!dismissedError && errorMessage ? (
        <div className="shrink-0 border-b border-velox-border px-4 py-2">
          <Alert
            variant="error"
            title="Could not load triage data"
            message={errorMessage}
            onDismiss={() => setDismissedError(true)}
          />
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <PrQueue
          items={sorted}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isLoading={prsQuery.isLoading}
          showSkeleton={showPrSkeleton}
          highlightedIds={highlightedIds}
          onRefresh={() => void prsQuery.refetch()}
        />
        <div className="min-h-0 overflow-hidden bg-velox-bg">
          <PrDetail
            key={selected?.id ?? 'empty'}
            pr={selected}
            isLoading={prsQuery.isLoading}
            showSkeleton={showPrSkeleton}
          />
        </div>
      </div>
    </AppShell>
  );
}
