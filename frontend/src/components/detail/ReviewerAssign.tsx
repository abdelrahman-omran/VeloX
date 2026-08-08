import { useState } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';

type ReviewerAssignProps = {
  reviewers: string[];
  prNumber: number;
  disabled?: boolean;
};

function initials(handle: string): string {
  const parts = handle.replace(/^@/, '').split(/[-_]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function ReviewerAssign({ reviewers, prNumber, disabled }: ReviewerAssignProps) {
  const { pushToast } = useToast();
  const [assigned, setAssigned] = useState<string | null>(null);
  const primary = reviewers[0] ?? null;

  const handleAssign = () => {
    if (!primary) return;
    setAssigned(primary);
    pushToast(`Assigned @${primary} to review #${prNumber}`);
  };

  return (
    <section
      aria-labelledby="reviewers-heading"
      className="rounded-md border border-velox-border bg-velox-card p-4"
    >
      <h3 id="reviewers-heading" className="text-sm font-semibold text-[#D5DEE9]">
        Recommended reviewers
      </h3>
      <p className="mt-1 text-xs text-velox-muted">
        Route to the person with the right history — unblock the sprint.
      </p>

      {reviewers.length === 0 ? (
        <p className="mt-3 text-sm text-velox-muted">No reviewers recommended yet.</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ul className="flex flex-wrap gap-2">
            {reviewers.map((handle) => (
              <li
                key={handle}
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${
                  assigned === handle
                    ? 'border-velox-brand bg-velox-soft'
                    : 'border-velox-border bg-velox-elevated'
                }`}
              >
                <span
                  className="inline-flex size-7 items-center justify-center rounded-full border border-velox-border bg-velox-card font-mono text-[10px] font-semibold text-velox-brand"
                  aria-hidden
                >
                  {initials(handle)}
                </span>
                <span className="font-mono text-xs text-velox-text">@{handle}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={disabled || !primary || assigned !== null}
          >
            {assigned ? 'Reviewer assigned' : 'Assign reviewer'}
          </Button>
        </div>
      )}
    </section>
  );
}
