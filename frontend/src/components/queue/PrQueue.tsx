import type { ScoredPr } from '../../schemas';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { PrQueueItem } from './PrQueueItem';

type PrQueueProps = {
  items: ScoredPr[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  showSkeleton: boolean;
  highlightedIds?: Set<string>;
  onRefresh?: () => void;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
};

export function PrQueue({
  items,
  selectedId,
  onSelect,
  isLoading,
  showSkeleton,
  highlightedIds,
  onRefresh,
  emptyActionLabel = 'Link a project',
  onEmptyAction,
}: PrQueueProps) {
  return (
    <section
      aria-label="PR priority queue"
      className="flex h-full min-h-0 flex-col border-r border-velox-border bg-velox-card"
    >
      <header className="flex items-center justify-between border-b border-velox-border px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#D5DEE9]">Priority queue</h2>
          <p className="text-xs text-velox-muted">Sorted by AI risk</p>
        </div>
        <span className="font-mono text-xs text-velox-muted">{items.length}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showSkeleton && isLoading ? (
          <div className="space-y-3 p-3" aria-busy="true" aria-label="Loading pull requests">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-md border border-velox-border p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            headline="No active PRs"
            description="Link a GitHub project, then open a PR — it will appear here risk-sorted for triage."
            actionLabel={onEmptyAction ? emptyActionLabel : onRefresh ? 'Refresh queue' : undefined}
            onAction={onEmptyAction ?? onRefresh}
          />
        ) : (
          <ul role="listbox" aria-label="Active pull requests">
            {items.map((pr) => (
              <PrQueueItem
                key={pr.id}
                pr={pr}
                selected={pr.id === selectedId}
                isNew={highlightedIds?.has(pr.id)}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
