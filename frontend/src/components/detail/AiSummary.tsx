type AiSummaryProps = {
  summary: string | null;
  status: 'scoring' | 'scored' | 'error';
};

export function AiSummary({ summary, status }: AiSummaryProps) {
  return (
    <section
      aria-labelledby="ai-summary-heading"
      className="rounded-md border border-velox-border bg-velox-card p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-velox-muted">
          Reasoning
        </span>
        <h3 id="ai-summary-heading" className="text-sm font-semibold text-[#D5DEE9]">
          AI summary
        </h3>
      </div>
      {status === 'scoring' ? (
        <p className="text-sm text-velox-muted">Scoring in progress…</p>
      ) : status === 'error' ? (
        <p className="text-sm text-velox-high">Scoring failed. Retry from the Engine or webhook.</p>
      ) : (
        <p className="text-sm leading-relaxed text-velox-text">
          {summary ?? 'No summary available.'}
        </p>
      )}
    </section>
  );
}
