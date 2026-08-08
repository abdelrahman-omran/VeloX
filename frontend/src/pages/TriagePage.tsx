import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sortPrsByRisk } from '../lib/risk';
import { useActivePrs } from '../hooks/useActivePrs';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { useProjectStore } from '../hooks/useProjectStore';
import { useSprintHealth } from '../hooks/useSprintHealth';
import { DEFAULT_FIXTURE_REPO } from '../schemas/project';
import { AppShell } from '../components/layout/AppShell';
import { PrQueue } from '../components/queue/PrQueue';
import { PrDetail } from '../components/detail/PrDetail';
import { Alert } from '../components/ui/Alert';

type TriagePageProps = {
  /** Prefill selection from /prs/:id */
  routePrId?: string;
};

export function TriagePage({ routePrId }: TriagePageProps = {}) {
  const params = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const deepLinkId = routePrId ?? params.id ?? searchParams.get('pr');

  const prsQuery = useActivePrs();
  const sprintQuery = useSprintHealth();
  const { projects, activeProject, setActiveProject } = useProjectStore();

  const sorted = useMemo(
    () => sortPrsByRisk(prsQuery.data ?? []),
    [prsQuery.data],
  );

  const filtered = useMemo(() => {
    if (!activeProject) return [];
    return sorted.filter(
      (pr) =>
        !pr.repo_full_name ||
        pr.repo_full_name.toLowerCase() === activeProject.full_name.toLowerCase(),
    );
  }, [sorted, activeProject]);

  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId);
  const [dismissedError, setDismissedError] = useState(false);
  const [unknownDeepLink, setUnknownDeepLink] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string> | null>(null);
  const deepLinkApplied = useRef<string | null>(null);

  const showPrSkeleton = useDelayedFlag(prsQuery.isLoading && !prsQuery.data);
  const showSprintSkeleton = useDelayedFlag(sprintQuery.isLoading && !sprintQuery.data);

  useEffect(() => {
    if (filtered.length === 0) return;

    const ids = new Set(filtered.map((p) => p.id));
    if (seenIdsRef.current === null) {
      seenIdsRef.current = ids;
      return;
    }

    const newcomers = filtered.filter(
      (p) => !seenIdsRef.current!.has(p.id) && p.risk_level === 'high',
    );
    if (newcomers.length > 0) {
      setHighlightedIds(new Set(newcomers.map((p) => p.id)));
      const timer = window.setTimeout(() => setHighlightedIds(new Set()), 2000);
      seenIdsRef.current = ids;
      return () => window.clearTimeout(timer);
    }

    seenIdsRef.current = ids;
  }, [filtered]);

  useEffect(() => {
    if (!deepLinkId || prsQuery.isLoading) return;
    if (deepLinkApplied.current === deepLinkId) return;

    const match = sorted.find((p) => p.id === deepLinkId);
    deepLinkApplied.current = deepLinkId;

    if (match) {
      setUnknownDeepLink(false);
      setSelectedId(match.id);
      if (match.repo_full_name) {
        const project = projects.find(
          (p) => p.full_name.toLowerCase() === match.repo_full_name!.toLowerCase(),
        );
        if (project) setActiveProject(project.id);
      }
      return;
    }

    if (prsQuery.data) {
      setUnknownDeepLink(true);
      setSelectedId(null);
    }
  }, [
    deepLinkId,
    prsQuery.isLoading,
    prsQuery.data,
    sorted,
    projects,
    setActiveProject,
  ]);

  useEffect(() => {
    if (deepLinkId) return;
    if (selectedId && filtered.some((p) => p.id === selectedId)) return;
    const preferred =
      filtered.find((p) => p.risk_level === 'high' || (p.risk_score ?? 0) >= 8) ??
      filtered[0];
    setSelectedId(preferred?.id ?? null);
  }, [filtered, selectedId, deepLinkId]);

  useEffect(() => {
    if (prsQuery.isError || sprintQuery.isError) {
      setDismissedError(false);
    }
  }, [prsQuery.isError, sprintQuery.isError]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setUnknownDeepLink(false);
    if (params.id) {
      void navigate(`/prs/${encodeURIComponent(id)}`, { replace: true });
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('pr', id);
    setSearchParams(next, { replace: true });
  };

  const selected = filtered.find((p) => p.id === selectedId) ?? null;
  const repoFallback =
    activeProject?.full_name ??
    selected?.repo_full_name ??
    filtered[0]?.repo_full_name ??
    DEFAULT_FIXTURE_REPO;

  const errorMessage =
    (prsQuery.error instanceof Error && prsQuery.error.message) ||
    (sprintQuery.error instanceof Error && sprintQuery.error.message) ||
    null;

  const syncLabel =
    import.meta.env.VITE_USE_FIXTURES === 'false'
      ? 'Live'
      : activeProject
        ? 'Fixtures'
        : 'No project';

  return (
    <AppShell
      variant="triage"
      sprintHealth={sprintQuery.data}
      sprintLoading={sprintQuery.isLoading}
      showSprintSkeleton={showSprintSkeleton}
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      fallbackRepoName={repoFallback}
      syncLabel={syncLabel}
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

      {unknownDeepLink ? (
        <div className="shrink-0 border-b border-velox-border px-4 py-2">
          <Alert
            variant="warning"
            title="Pull request not found"
            message={`No scored PR matches “${deepLinkId}”. Pick one from the queue or link the right project.`}
          />
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <PrQueue
          items={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
          isLoading={prsQuery.isLoading}
          showSkeleton={showPrSkeleton}
          highlightedIds={highlightedIds}
          onRefresh={() => void prsQuery.refetch()}
          emptyActionLabel="Link a project"
          onEmptyAction={() => void navigate('/connect')}
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
