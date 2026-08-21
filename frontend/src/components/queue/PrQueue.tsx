import { useMemo, useState } from 'react';
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
  const [groupBy, setGroupBy] = useState<'priority' | 'author'>('priority');

  const groupedItems = useMemo(() => {
    if (groupBy === 'priority') return [];

    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      const author = item.author ? item.author.toLowerCase() : 'unknown';
      if (!groups[author]) groups[author] = [];
      groups[author].push(item);
    }

    return Object.keys(groups)
      .sort()
      .map((author) => ({
        author,
        items: groups[author],
      }));
  }, [items, groupBy]);

  return (
    <section
      aria-label="PR priority queue"
      className="flex h-full min-h-0 flex-col border-r border-velox-border bg-velox-card"
    >
      <header className="flex items-center justify-between border-b border-velox-border px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#D5DEE9]">Queue</h2>
          <span className="font-mono text-xs text-velox-muted">{items.length} PRs</span>
        </div>
        
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as 'priority' | 'author')}
          className="rounded border border-velox-border bg-velox-bg px-2 py-1 text-xs text-velox-text focus:outline-none focus:ring-1 focus:ring-velox-brand"
          aria-label="Queue grouping option"
        >
          <option value="priority">Sort by Priority</option>
          <option value="author">Group by Author</option>
        </select>
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
        ) : groupBy === 'priority' ? (
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
        ) : (
          <div role="listbox" aria-label="Active pull requests grouped by author">
            {groupedItems.map((group) => (
              <div key={group.author}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-y border-velox-border bg-velox-elevated/95 px-3 py-1.5 backdrop-blur-md">
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {group.author === 'unknown' ? 'unknown' : `@${group.author}`}
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    {group.items.length}
                  </span>
                </div>
                <ul>
                  {group.items.map((pr) => (
                    <PrQueueItem
                      key={pr.id}
                      pr={pr}
                      selected={pr.id === selectedId}
                      isNew={highlightedIds?.has(pr.id)}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}