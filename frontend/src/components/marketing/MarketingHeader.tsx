import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Button } from '../ui/Button';

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-velox-border/80 bg-velox-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link to="/" className="inline-flex shrink-0 rounded-md focus-visible:outline-offset-4">
          <Logo size={28} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <a href="#product" className="text-sm text-velox-muted transition-colors hover:text-velox-text">
            Product
          </a>
          <a href="#how" className="text-sm text-velox-muted transition-colors hover:text-velox-text">
            How it works
          </a>
          <Link
            to="/login"
            className="text-sm text-velox-muted transition-colors hover:text-velox-text"
          >
            Log in
          </Link>
          <Link to="/signup">
            <Button variant="primary" className="min-h-10 px-4 py-2 text-sm">
              Open Glass
            </Button>
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-velox-border text-velox-text md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden className="font-mono text-lg">
            {open ? '×' : '≡'}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-velox-border px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            <a
              href="#product"
              className="py-2 text-sm text-velox-text"
              onClick={() => setOpen(false)}
            >
              Product
            </a>
            <a
              href="#how"
              className="py-2 text-sm text-velox-text"
              onClick={() => setOpen(false)}
            >
              How it works
            </a>
            <Link
              to="/login"
              className="py-2 text-sm text-velox-muted"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)}>
              <Button variant="primary" className="w-full">
                Open Glass
              </Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
