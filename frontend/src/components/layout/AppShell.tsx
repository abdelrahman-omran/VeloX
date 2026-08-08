import type { ReactNode } from 'react';
import type { SprintHealth } from '../../schemas';
import { Logo } from '../Logo';
import { SprintHealthBar } from '../sprint/SprintHealthBar';

type AppShellProps = {
  children: ReactNode;
  sprintHealth: SprintHealth | undefined;
  sprintLoading: boolean;
  showSprintSkeleton: boolean;
  repoName: string;
  syncLabel?: string;
};

export function AppShell({
  children,
  sprintHealth,
  sprintLoading,
  showSprintSkeleton,
  repoName,
  syncLabel = 'Synced',
}: AppShellProps) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-velox-bg text-velox-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-velox-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-velox-border bg-velox-card px-4 py-3">
        <div className="justify-self-start">
          <Logo size={28} />
        </div>

        <div className="justify-self-center">
          <SprintHealthBar
            health={sprintHealth}
            isLoading={sprintLoading}
            showSkeleton={showSprintSkeleton}
          />
        </div>

        <div className="justify-self-end flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-md border border-velox-border bg-velox-elevated px-2.5 py-1.5 sm:flex"
            title="Active repository"
          >
            <span className="font-mono text-xs text-velox-text">{repoName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-velox-muted">
            <span
              className="inline-block size-1.5 rounded-full bg-velox-low"
              aria-hidden
            />
            <span className="hidden md:inline">{syncLabel}</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
