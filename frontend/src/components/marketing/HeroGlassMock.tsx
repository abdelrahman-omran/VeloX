/** Static Glass product composition for the landing hero — not interactive. */
export function HeroGlassMock() {
  return (
    <div
      className="animate-hero-panel relative w-full overflow-hidden border-t border-velox-border bg-velox-card"
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-velox-border px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm font-bold tracking-tight text-velox-text">
            VeloX
          </span>
          <span className="rounded border border-velox-muted/25 bg-velox-muted/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-velox-muted">
            AI
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block size-1.5 rounded-full bg-velox-med" />
          <span className="font-mono text-velox-muted">Confidence:</span>
          <span className="font-mono font-semibold text-velox-text">62%</span>
          <span className="font-mono text-velox-muted">↓</span>
        </div>
        <span className="hidden font-mono text-[11px] text-velox-muted sm:inline">
          example/acme-payments
        </span>
      </div>

      <div className="grid min-h-[280px] grid-cols-1 sm:min-h-[340px] lg:grid-cols-[280px_1fr]">
        <div className="border-b border-velox-border lg:border-b-0 lg:border-r">
          <div className="border-b border-velox-border px-3 py-2">
            <p className="text-xs font-semibold text-[#D5DEE9]">Priority queue</p>
          </div>
          <div className="border-l-2 border-l-velox-brand bg-velox-soft px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-velox-muted">#42</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  color: 'var(--velox-high)',
                  backgroundColor: 'color-mix(in srgb, var(--velox-high) 15%, transparent)',
                }}
              >
                <span className="size-1.5 rounded-full bg-velox-high" />
                High Risk
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-velox-text">
              Rotate auth token signing and migrate sessions
            </p>
            <p className="mt-1 font-mono text-[11px] text-velox-muted">
              Blast: 2 svc · Score: 8/10
            </p>
          </div>
          <div className="border-l-2 border-l-transparent px-3 py-3 opacity-60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-velox-muted">#41</span>
              <span className="text-[11px] font-semibold text-velox-med">Medium</span>
            </div>
            <p className="mt-1 truncate text-sm text-velox-muted">
              Add retry backoff to payments webhook
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-velox-muted">
            Reasoning
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-velox-text">
            PR touches auth token refresh → blast radius includes auth-service and
            database-schema → elevates delivery risk for the current sprint.
          </p>
          <div className="pt-2">
            <p className="text-xs font-semibold text-[#D5DEE9]">Blast radius</p>
            <ul className="mt-2 space-y-1.5 border-l border-velox-border pl-3">
              <li className="flex items-center gap-2 font-mono text-[13px] text-[#B8C2D0]">
                <span className="size-1.5 rounded-full bg-velox-high" />
                auth-service
              </li>
              <li className="flex items-center gap-2 font-mono text-[13px] text-[#B8C2D0]">
                <span className="size-1.5 rounded-full bg-velox-high" />
                database-schema
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
