import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Skeleton } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';
import { useJiraSprint } from '../hooks/useJiraSprints';
import { useProjectStore } from '../hooks/useProjectStore';

export function SprintDetailPage() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const { sprint, isLoading, error } = useJiraSprint(sprintId);
  const { projects, activeProject, setActiveProject } = useProjectStore();

  // Temporary dummy UI states while metrics are built
  const dummyProgress = 65;
  const dummyTechDebt = 14;

  return (
    <AppShell
      variant="setup"
      centerLabel="Sprint Details"
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      syncLabel="Jira"
    >
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/project-analysis')}
            className="text-xs font-mono text-velox-muted hover:text-velox-text transition-colors flex items-center gap-2"
          >
            ← Back to Project Analysis
          </button>
          
          {isLoading ? (
            <Skeleton className="h-8 w-1/2" />
          ) : error || !sprint ? (
             <Alert variant="error" title="Not found" message="Sprint data could not be loaded." />
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-velox-border/50 pb-4">
              <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-velox-text">{sprint.name}</h1>
                    <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase ${
                        sprint.state === 'active'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border border-velox-border bg-velox-soft text-velox-muted'
                        }`}
                    >
                        {sprint.state}
                    </span>
                </div>
                {sprint.goal && <p className="mt-2 text-sm text-velox-muted">{sprint.goal}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Content */}
        {!isLoading && sprint && (
          <div className="space-y-6">
            
            {/* Top Level Sprint Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="rounded-lg border border-velox-border bg-velox-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Soon
                        </span>
                        <h3 className="text-xs font-semibold text-velox-muted uppercase tracking-wider">Sprint Progress</h3>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-3">
                        <div className="flex-1 h-2 rounded-full bg-velox-soft overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dummyProgress}%` }}></div>
                        </div>
                        <span className="font-mono text-sm font-bold text-velox-text">{dummyProgress}%</span>
                    </div>
                </div>

                <div className="rounded-lg border border-velox-border bg-velox-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Soon
                        </span>
                        <h3 className="text-xs font-semibold text-velox-muted uppercase tracking-wider">Sprint Tech Debt</h3>
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-2xl font-bold text-rose-400">{dummyTechDebt}</span>
                        <span className="text-sm text-velox-muted mb-1">pts</span>
                    </div>
                </div>

                <div className="rounded-lg border border-velox-border bg-velox-card p-4">
                    <h3 className="text-xs font-semibold text-velox-muted uppercase tracking-wider mb-3">Total Issues</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-2xl font-bold text-velox-text">{sprint.issues.length}</span>
                        <span className="text-sm text-velox-muted mb-1">Tickets</span>
                    </div>
                </div>
            </div>

            {/* Burndown Chart specifically for THIS sprint */}
            <div className="rounded-lg border border-velox-border bg-velox-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Soon
                </span>
                <h3 className="text-sm font-bold text-velox-text">Sprint Velocity Burndown</h3>
              </div>
              <p className="text-xs text-velox-muted mb-6">Actual work remaining against optimal sprint trajectory.</p>
              
              <div className="relative h-48 w-full border-b border-l border-velox-border/60 p-2">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" className="text-velox-muted/40" strokeWidth="2" strokeDasharray="4 4" />
                  {sprint.state === 'active' ? (
                     <path d="M 0 0 L 20 15 L 40 45 L 60 55" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  ) : (
                     <path d="M 0 0 L 10 5" fill="none" stroke="#64748b" strokeWidth="2.5" />
                  )}
                </svg>
                <div className="absolute inset-x-0 -bottom-6 flex justify-between text-[10px] font-mono text-velox-muted">
                  <span>Start</span>
                  <span>Mid-Sprint</span>
                  <span>End</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Issue List */}
            <div className="rounded-lg border border-velox-border bg-velox-card">
              <div className="border-b border-velox-border bg-velox-elevated px-5 py-3">
                <h3 className="text-sm font-bold text-velox-text">Sprint Backlog</h3>
              </div>
              <div className="p-4">
                  {sprint.issues.length === 0 ? (
                    <p className="text-sm italic text-velox-muted">No issues in this sprint yet.</p>
                  ) : (
                    <ul className="divide-y divide-velox-border/50">
                      {sprint.issues.map((issue: any) => (
                        <li key={issue.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="shrink-0 font-mono font-semibold text-emerald-400">
                              {issue.key}
                            </span>
                            <span className="truncate font-medium text-velox-text">
                              {issue.summary}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 font-mono text-[11px]">
                            {issue.story_points ? (
                              <span className="rounded bg-velox-soft px-2 py-1 text-velox-muted">
                                {issue.story_points} pts
                              </span>
                            ) : null}
                            <span className="rounded border border-velox-border bg-velox-bg px-2.5 py-1 text-velox-muted">
                              {issue.status}
                            </span>
                            <span className="font-sans text-velox-muted w-24 text-right">
                              {issue.assignee ? `@${issue.assignee}` : 'Unassigned'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}