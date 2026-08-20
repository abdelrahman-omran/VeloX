import { formatRelativeTime } from '../../lib/risk';
import type { ScoredPr } from '../../schemas';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { RiskBadge } from '../queue/RiskBadge';
import { AiSummary } from './AiSummary';

type PrDetailProps = {
  pr: ScoredPr | null;
  isLoading: boolean;
  showSkeleton: boolean;
};

export function PrDetail({ pr, isLoading, showSkeleton }: PrDetailProps) {
  if (showSkeleton && isLoading) {
    return (
      <div className="space-y-4 p-6" aria-busy="true" aria-label="Loading PR detail">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!pr) {
    return (
      <EmptyState
        headline="Select a pull request"
        description="Pick an item from the priority queue to see the AI summary and risk score."
      />
    );
  }

  return (
    <article className="flex h-full min-h-0 flex-col overflow-y-auto p-6" aria-label={`PR #${pr.number}`}>
      <header className="mb-5 space-y-3 border-b border-velox-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-velox-muted">#{pr.number}</span>
          <RiskBadge pr={pr} />
        </div>
        <h2 className="text-2xl font-bold text-velox-text">{pr.title}</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-velox-muted">
          <span>
            by <span className="font-mono text-velox-text">@{pr.author}</span>
          </span>
          {pr.repo ? (
            <span className="font-mono text-xs">{pr.repo}</span>
          ) : null}
          <span className="font-mono text-xs">{formatRelativeTime(pr.updated_at)}</span>
          <a
            href={pr.html_url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="text-velox-brand hover:text-velox-hover"
          >
            Open on GitHub
          </a>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <AiSummary summary={pr.ai_summary ?? null} status={pr.status} />
      </div>
    </article>
  );
}