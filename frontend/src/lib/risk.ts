import type { RiskLevel, ScoredPr } from '../schemas';

/** Brand has three risk colors; map critical → high, unknown → medium wash. */
export type UiRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export function deriveRiskLevel(pr: Pick<ScoredPr, 'risk_score' | 'status'>): UiRiskLevel {
  if (pr.status === 'scoring' || pr.status === 'error') return 'unknown';

  const score = pr.risk_score;
  if (score == null) return 'unknown';
  if (score >= 80) return 'high'; // Adjusted mapping logic scaled assuming 0-100 max per the schema
  if (score >= 50) return 'medium';
  return 'low';
}

export function riskLabel(level: UiRiskLevel): string {
  switch (level) {
    case 'high':
      return 'High Risk';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Scoring';
  }
}

export function riskColorVar(level: UiRiskLevel): string {
  switch (level) {
    case 'high':
      return 'var(--velox-high)';
    case 'medium':
      return 'var(--velox-med)';
    case 'low':
      return 'var(--velox-low)';
    default:
      return 'var(--velox-muted)';
  }
}

export function confidenceRiskLevel(percent: number): UiRiskLevel {
  if (percent >= 75) return 'low';
  if (percent >= 50) return 'medium';
  return 'high';
}

export function sortPrsByRisk(items: ScoredPr[]): ScoredPr[] {
  const rank = (level: UiRiskLevel): number => {
    switch (level) {
      case 'high':
        return 0;
      case 'medium':
        return 1;
      case 'low':
        return 2;
      default:
        return 3;
    }
  };

  return [...items].sort((a, b) => {
    const levelDiff = rank(deriveRiskLevel(a)) - rank(deriveRiskLevel(b));
    if (levelDiff !== 0) return levelDiff;
    const scoreA = a.risk_score ?? -1;
    const scoreB = b.risk_score ?? -1;
    return scoreB - scoreA;
  });
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const deltaSec = Math.max(0, Math.round((now - then) / 1000));
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}

export function toApiRiskLevel(level: UiRiskLevel): RiskLevel {
  return level === 'unknown' ? 'unknown' : level;
}