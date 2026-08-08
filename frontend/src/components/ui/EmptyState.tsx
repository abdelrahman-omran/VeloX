import { Button } from './Button';

type EmptyStateProps = {
  headline: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  headline,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="text-base font-semibold text-velox-text">{headline}</h2>
      <p className="max-w-sm text-sm text-velox-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
