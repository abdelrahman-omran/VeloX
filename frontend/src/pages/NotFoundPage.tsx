import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { useProjectStore } from '../hooks/useProjectStore';

export function NotFoundPage() {
  const { projects, activeProject, setActiveProject } = useProjectStore();

  return (
    <AppShell
      variant="setup"
      centerLabel="Not found"
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      syncLabel="—"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="font-mono text-sm text-velox-muted">404</p>
        <h1 className="mt-2 text-2xl font-bold text-velox-text">Page not found</h1>
        <p className="mt-2 text-sm text-velox-muted">
          That route isn’t part of VeloX Glass. Head back to the triage inbox.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button variant="primary">Open triage</Button>
          </Link>
          <Link to="/projects">
            <Button variant="secondary">Projects</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
