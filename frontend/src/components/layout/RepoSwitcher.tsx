import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { LinkedProject } from '../../schemas/project';

type RepoSwitcherProps = {
  projects: LinkedProject[];
  activeProject: LinkedProject | null;
  fallbackRepoName: string;
  onSelect: (id: string) => void;
  syncLabel: string;
};

export function RepoSwitcher({
  projects,
  activeProject,
  fallbackRepoName,
  onSelect,
  syncLabel,
}: RepoSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const navigate = useNavigate();
  const label = activeProject?.full_name ?? fallbackRepoName;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      <button
        type="button"
        className="hidden items-center gap-2 rounded-md border border-velox-border bg-velox-elevated px-2.5 py-1.5 font-mono text-xs text-velox-text hover:border-velox-brand/50 sm:inline-flex"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Active repository"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <span className="text-velox-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-md border border-velox-border bg-velox-card py-1 shadow-lg"
        >
          {projects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-velox-muted">No linked projects yet.</p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                type="button"
                role="menuitem"
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-mono text-xs hover:bg-velox-elevated ${
                  project.id === activeProject?.id
                    ? 'bg-velox-soft text-velox-text'
                    : 'text-velox-text'
                }`}
                onClick={() => {
                  onSelect(project.id);
                  setOpen(false);
                  void navigate('/');
                }}
              >
                <span>{project.full_name}</span>
                <span className="text-velox-muted">{project.webhook_status}</span>
              </button>
            ))
          )}
          <div className="my-1 border-t border-velox-border" />
          <Link
            role="menuitem"
            to="/projects"
            className="block px-3 py-2 text-xs text-velox-brand hover:bg-velox-elevated"
            onClick={() => setOpen(false)}
          >
            Manage projects
          </Link>
          <Link
            role="menuitem"
            to="/connect"
            className="block px-3 py-2 text-xs text-velox-muted hover:bg-velox-elevated hover:text-velox-text"
            onClick={() => setOpen(false)}
          >
            Link a project
          </Link>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-velox-muted">
        <span
          className={`inline-block size-1.5 rounded-full ${
            activeProject?.webhook_status === 'ok'
              ? 'bg-velox-low'
              : activeProject?.webhook_status === 'pending'
                ? 'bg-velox-med'
                : 'bg-velox-muted'
          }`}
          aria-hidden
        />
        <span className="hidden md:inline">{syncLabel}</span>
      </div>
    </div>
  );
}
