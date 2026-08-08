import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useProjectStore } from '../hooks/useProjectStore';
import { useToast } from '../hooks/useToast';
import { RepoFullNameSchema } from '../schemas/project';

const webhookBase =
  import.meta.env.VITE_API_PROXY_TARGET?.replace(/\/$/, '') ??
  'http://127.0.0.1:8000';

export function ConnectPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { projects, activeProject, setActiveProject, linkProject } = useProjectStore();
  const [repo, setRepo] = useState('example/acme-payments');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = RepoFullNameSchema.safeParse(repo);
  const showFieldError = touched && !validation.success;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    const parsed = RepoFullNameSchema.safeParse(repo);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid repository');
      return;
    }

    try {
      linkProject(parsed.data, 'pending');
      pushToast(`Linked ${parsed.data}`);
      void navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link project');
    }
  };

  return (
    <AppShell
      variant="setup"
      centerLabel="Setup"
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      syncLabel="Setup"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
        <h1 className="text-2xl font-bold text-velox-text">Link a project</h1>
        <p className="mt-2 text-sm text-velox-muted">
          Point VeloX at the repo you’ll triage. Webhook secrets stay in the Engine
          <span className="font-mono"> .env</span> — this page only records the project.
        </p>

        <ol className="mt-6 space-y-2 text-sm text-velox-muted">
          <li className="flex gap-2">
            <span className="font-mono text-velox-brand">1</span>
            Save <span className="font-mono text-velox-text">owner/repo</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-velox-brand">2</span>
            Add GitHub webhook → Engine
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-velox-brand">3</span>
            Open triage inbox
          </li>
        </ol>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="repo" className="mb-1.5 block text-sm font-medium text-velox-text">
              Repository
            </label>
            <input
              id="repo"
              name="repo"
              type="text"
              autoComplete="off"
              placeholder="owner/repo"
              value={repo}
              onChange={(e) => {
                setRepo(e.target.value);
                setError(null);
              }}
              onBlur={() => setTouched(true)}
              aria-invalid={showFieldError}
              aria-describedby={showFieldError ? 'repo-error' : 'repo-hint'}
              className="w-full rounded-md border border-velox-border bg-velox-elevated px-3 py-2.5 font-mono text-sm text-velox-text placeholder:text-velox-muted focus:border-velox-brand"
            />
            <p id="repo-hint" className="mt-1.5 text-xs text-velox-muted">
              Format: owner/repo — e.g. example/acme-payments
            </p>
            {showFieldError ? (
              <p id="repo-error" className="mt-1 text-xs text-velox-high" role="alert">
                {validation.success
                  ? null
                  : (validation.error.issues[0]?.message ?? 'Invalid repository')}
              </p>
            ) : null}
          </div>

          {error ? (
            <Alert variant="error" title="Could not save" message={error} />
          ) : null}

          <Alert
            variant="info"
            title="Webhook target"
            message={`POST ${webhookBase}/webhooks/github — verify X-Hub-Signature-256 with GITHUB_WEBHOOK_SECRET on the Engine.`}
          />

          <ul className="space-y-2 rounded-md border border-velox-border bg-velox-card p-3 text-sm text-velox-muted">
            <li>□ Tunnel or public URL reachable from GitHub</li>
            <li>□ Webhook delivery shows 202 in GitHub</li>
            <li>□ Open triage after the first scored PR lands</li>
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" variant="primary">
              Save project
            </Button>
            <Link to="/app" className="text-sm text-velox-muted hover:text-velox-text">
              Cancel
            </Link>
            <Link to="/projects" className="text-sm text-velox-brand hover:text-velox-hover">
              View projects
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
