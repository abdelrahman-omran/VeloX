import { confidenceRiskLevel, riskColorVar } from '../../lib/risk';
import type { SprintHealth } from '../../schemas';
import { Skeleton } from '../ui/Skeleton';

type SprintHealthBarProps = {
  health: SprintHealth | undefined;
  isLoading: boolean;
  showSkeleton: boolean;
};

export function SprintHealthBar({ health, isLoading, showSkeleton }: SprintHealthBarProps) {
  if (showSkeleton && isLoading) {
    return (
      <div className="flex items-center gap-2" aria-busy="true">
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!health) {
    return <span className="text-xs text-velox-muted">Sprint health unavailable</span>;
  }

  const level = confidenceRiskLevel(health.confidence_percent);
  const color = riskColorVar(level);
  const trendArrow =
    health.trend === 'up' ? '↑' : health.trend === 'down' ? '↓' : '→';

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 text-sm"
      title={health.notes ?? health.sprint_name}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-velox-muted">Confidence:</span>
      <span className="font-mono font-semibold text-velox-text">
        {health.confidence_percent}%
      </span>
      <span className="font-mono text-velox-muted" aria-label={`Trend ${health.trend}`}>
        {trendArrow}
      </span>
      <span className="hidden text-xs text-velox-muted sm:inline">{health.sprint_name}</span>
    </div>
  );
}
