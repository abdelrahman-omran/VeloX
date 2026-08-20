import { deriveRiskLevel, riskColorVar, riskLabel, type UiRiskLevel } from '../../lib/risk';
import type { ScoredPr } from '../../schemas';

type RiskBadgeProps = {
  pr?: Pick<ScoredPr, 'risk_score' | 'status'>;
  level?: UiRiskLevel;
  className?: string;
};

export function RiskBadge({ pr, level, className = '' }: RiskBadgeProps) {
  const resolved = level ?? (pr ? deriveRiskLevel(pr) : 'unknown');
  const color = riskColorVar(resolved);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`.trim()}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {riskLabel(resolved)}
    </span>
  );
}