type BlastRadiusListProps = {
  services: string[];
};

export function BlastRadiusList({ services }: BlastRadiusListProps) {
  return (
    <section
      aria-labelledby="blast-heading"
      className="rounded-md border border-velox-border bg-velox-card p-4"
    >
      <h3 id="blast-heading" className="text-sm font-semibold text-[#D5DEE9]">
        Blast radius
      </h3>
      <p className="mt-1 text-xs text-velox-muted">
        Changed paths → affected services → delivery pressure
      </p>

      {services.length === 0 ? (
        <p className="mt-3 text-sm text-velox-muted">No service impact detected.</p>
      ) : (
        <ul className="mt-3 space-y-2" role="tree" aria-label="Blast radius services">
          <li role="treeitem" aria-expanded="true">
            <span className="font-mono text-xs text-velox-muted">impact</span>
            <ul className="mt-2 space-y-1.5 border-l border-velox-border pl-3" role="group">
              {services.map((service) => (
                <li key={service} role="treeitem" className="flex items-center gap-2">
                  <span
                    className="inline-block size-1.5 rounded-full bg-velox-high"
                    aria-hidden
                  />
                  <span className="font-mono text-[13px] text-[#B8C2D0]">{service}</span>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      )}
    </section>
  );
}
