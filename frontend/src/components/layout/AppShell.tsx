import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SprintHealth } from '../../schemas';
import type { LinkedProject } from '../../schemas/project';
import { DEFAULT_FIXTURE_REPO } from '../../schemas/project';
import { Logo } from '../Logo';
import { SprintHealthBar } from '../sprint/SprintHealthBar';
import { RepoSwitcher } from './RepoSwitcher';

export type AppShellVariant = 'triage' | 'setup';

type AppShellProps = {
  children: ReactNode;
  variant?: AppShellVariant;
  sprintHealth?: SprintHealth;
  sprintLoading?: boolean;
  showSprintSkeleton?: boolean;
  projects?: LinkedProject[];
  activeProject?: LinkedProject | null;
  onSelectProject?: (id: string) => void;
  fallbackRepoName?: string;
  syncLabel?: string;
  centerLabel?: string;
};

export function AppShell({
  children,
  variant = 'triage',
  sprintHealth,
  sprintLoading = false,
  showSprintSkeleton = false,
  projects = [],
  activeProject = null,
  onSelectProject,
  fallbackRepoName = DEFAULT_FIXTURE_REPO,
  syncLabel = 'Synced',
  centerLabel = 'Setup',
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
          <Link to="/" className="inline-flex rounded-md focus-visible:outline-offset-4">
            <Logo size={28} />
          </Link>
        </div>

        <div className="justify-self-center">
          {variant === 'triage' ? (
            <SprintHealthBar
              health={sprintHealth}
              isLoading={sprintLoading}
              showSkeleton={showSprintSkeleton}
            />
          ) : (
            <span className="text-sm text-velox-muted">{centerLabel}</span>
          )}
        </div>

        <div className="justify-self-end">
          <RepoSwitcher
            projects={projects}
            activeProject={activeProject}
            fallbackRepoName={fallbackRepoName}
            onSelect={onSelectProject ?? (() => undefined)}
            syncLabel={syncLabel}
          />
        </div>
      </header>

      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
