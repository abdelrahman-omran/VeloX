type AlertProps = {
  variant?: 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onDismiss?: () => void;
};

const styles = {
  error: 'border-velox-high/40 bg-[rgba(226,75,74,0.12)] text-velox-text',
  warning: 'border-velox-med/40 bg-[rgba(209,154,38,0.12)] text-velox-text',
  info: 'border-velox-brand/40 bg-velox-soft text-velox-text',
};

export function Alert({ variant = 'info', title, message, onDismiss }: AlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-sm ${styles[variant]}`}
    >
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-velox-muted">{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-velox-muted hover:text-velox-text"
          aria-label="Dismiss"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
