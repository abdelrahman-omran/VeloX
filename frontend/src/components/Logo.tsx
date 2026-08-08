export type LogoProps = {
  /** Emblem edge length in px. Navbar default: 28. Minimum: 20. */
  size?: number;
  showWordmark?: boolean;
  showAiBadge?: boolean;
  className?: string;
  /** Unique gradient id when multiple logos mount on one page. */
  gradientId?: string;
};

/**
 * VeloX “Focal Branch” lockup — PR branch nodes + foresight prism.
 */
export function Logo({
  size = 28,
  showWordmark = true,
  showAiBadge = true,
  className = '',
  gradientId = 'velox-grad',
}: LogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 select-none ${className}`.trim()}
      aria-label="VeloX"
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
          aria-hidden
        >
          <path
            d="M16 2L28 8V24L16 30L4 24V8L16 2Z"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinejoin="round"
            className="opacity-80"
          />
          <circle cx="11" cy="11" r="2.5" fill="#4C8BF5" />
          <circle cx="21" cy="11" r="2.5" fill="#8B97A8" />
          <circle cx="16" cy="21" r="2.5" fill="#3D9B74" />
          <path
            d="M11 13.5V17L14.5 20.5"
            stroke="#4C8BF5"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 13.5V17L17.5 20.5"
            stroke="#8B97A8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id={gradientId}
              x1="4"
              y1="2"
              x2="28"
              y2="30"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4C8BF5" />
              <stop offset="1" stopColor="#243041" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showWordmark && (
        <div className="flex items-center">
          <span className="font-sans text-lg font-bold tracking-tight text-velox-text">
            VeloX
          </span>
          {showAiBadge && (
            <span className="ml-1 rounded border border-velox-muted/25 bg-velox-muted/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-velox-muted">
              AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Logo;
