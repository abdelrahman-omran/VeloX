import { deriveRiskLevel, formatRelativeTime } from '../../lib/risk';
import type { ScoredPr } from '../../schemas';
import { RiskBadge } from './RiskBadge';

type PrQueueItemProps = {
  pr: ScoredPr;
  selected: boolean;
  isNew?: boolean;
  onSelect: (id: string) => void;
};

export function PrQueueItem({ pr, selected, isNew, onSelect }: PrQueueItemProps) {
  const level = deriveRiskLevel(pr);
  const blastCount = pr.blast_radius_services.length;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(pr.id)}
        aria-current={selected ? 'true' : undefined}
        className={`w-full border-b border-velox-border px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-offset-[-2px] ${
          selected
            ? 'border-l-2 border-l-velox-brand bg-velox-soft'
            : 'border-l-2 border-l-transparent hover:bg-velox-elevated/60'
        } ${isNew && level === 'high' ? 'animate-row-highlight' : ''}`.trim()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-velox-muted">#{pr.number}</span>
              {pr.status === 'scoring' ? (
                <span className="text-xs font-medium text-velox-muted">Scoring…</span>
              ) : pr.status === 'error' ? (
                <span className="text-xs font-medium text-velox-high">Error</span>
              ) : (
                <RiskBadge level={level} />
              )}
            </div>
            <p className="mt-1 truncate text-sm font-medium text-velox-text">{pr.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-velox-muted">
              <span>@{pr.author}</span>
              {blastCount > 0 ? <span>Blast: {blastCount} svc</span> : null}
              {pr.risk_score != null ? <span>Score: {pr.risk_score}/10</span> : null}
              <span>{formatRelativeTime(pr.updated_at)}</span>
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}
