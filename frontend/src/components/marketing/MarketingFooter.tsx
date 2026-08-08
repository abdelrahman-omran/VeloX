import { Link } from 'react-router-dom';
import { Logo } from '../Logo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-velox-border bg-velox-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo size={24} />
          <p className="mt-2 max-w-xs text-sm text-velox-muted">
            Engineering Intelligence Before the Merge.
          </p>
          <p className="mt-3 font-mono text-[11px] text-velox-muted">
            Demo mode — auth is mocked
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          <a href="#product" className="text-velox-muted hover:text-velox-text">
            Product
          </a>
          <a href="#how" className="text-velox-muted hover:text-velox-text">
            How it works
          </a>
          <Link to="/login" className="text-velox-muted hover:text-velox-text">
            Log in
          </Link>
          <Link to="/app" className="text-velox-muted hover:text-velox-text">
            Glass
          </Link>
        </nav>
      </div>
    </footer>
  );
}
