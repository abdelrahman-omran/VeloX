const steps = [
  {
    label: 'Micro',
    title: 'Risky PR opens',
    detail: 'Auth token signing + sessions migration lands in the triage queue with a High Risk badge.',
    accent: 'var(--velox-high)',
  },
  {
    label: 'Blast',
    title: 'Blast radius expands',
    detail: 'Changed paths map to auth-service and database-schema — critical path, extra review.',
    accent: 'var(--velox-med)',
  },
  {
    label: 'Macro',
    title: 'Sprint pressure shows',
    detail: 'Mocked confidence drops. The Team Lead assigns a backend owner — before the status meeting.',
    accent: 'var(--velox-brand)',
  },
] as const;

export function ImpactChain() {
  return (
    <ol className="mx-auto max-w-2xl space-y-0">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className="animate-chain-step relative flex gap-4 border-l border-velox-border py-6 pl-6"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <span
            className="absolute -left-1.5 top-7 size-3 rounded-full"
            style={{ backgroundColor: step.accent }}
            aria-hidden
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-velox-muted">
              {step.label}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#D5DEE9]">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-velox-muted">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
