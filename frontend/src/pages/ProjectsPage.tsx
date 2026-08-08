import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useProjectStore } from '../hooks/useProjectStore';
import { useToast } from '../hooks/useToast';
import { formatRelativeTime } from '../lib/risk';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProject,
    removeProject,
  } = useProjectStore();

  return (
    <AppShell
      variant="setup"
      centerLabel="Projects"
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      syncLabel="Projects"
    >
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-velox-text">Projects</h1>
            <p className="mt-1 text-sm text-velox-muted">
              Linked GitHub repositories for triage. Stored locally until the Engine
              exposes project APIs.
            </p>
          </div>
          <Button variant="primary" onClick={() => void navigate('/connect')}>
            Link a project
          </Button>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            headline="No projects linked"
            description="Link the demo repo to start the morning triage inbox."
            actionLabel="Link a project"
            onAction={() => void navigate('/connect')}
          />
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <li
                  key={project.id}
                  className={`rounded-md border px-4 py-3 ${
                    isActive
                      ? 'border-velox-brand bg-velox-soft'
                      : 'border-velox-border bg-velox-card'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-velox-text">
                        {project.full_name}
                      </p>
                      <p className="mt-1 text-xs text-velox-muted">
                        Linked {formatRelativeTime(project.linked_at)} · webhook{' '}
                        <span className="font-mono">{project.webhook_status}</span>
                        {isActive ? ' · active' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        className="min-h-9 px-3 py-1.5 text-xs"
                        onClick={() => {
                          setActiveProject(project.id);
                          void navigate('/app');
                        }}
                      >
                        Open triage
                      </Button>
                      {!isActive ? (
                        <Button
                          variant="secondary"
                          className="min-h-9 px-3 py-1.5 text-xs"
                          onClick={() => setActiveProject(project.id)}
                        >
                          Set active
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 py-1.5 text-xs text-velox-high"
                        onClick={() => {
                          removeProject(project.id);
                          pushToast(`Removed ${project.full_name}`);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-center text-sm text-velox-muted">
          Need another repo?{' '}
          <Link to="/connect" className="text-velox-brand hover:text-velox-hover">
            Link a project
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
