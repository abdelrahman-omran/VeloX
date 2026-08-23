import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useJiraSprints } from '../hooks/useJiraSprints';
import { useProjectStore } from '../hooks/useProjectStore';

export function ProjectAnalysisPage() {
  const navigate = useNavigate();
  const { sprints, isLoading, error, refetch } = useJiraSprints();
  const { projects, activeProject, setActiveProject } = useProjectStore();

  return (
    <AppShell
      variant="setup"
      centerLabel="Project Analysis"
      projects={projects}
      activeProject={activeProject}
      onSelectProject={setActiveProject}
      syncLabel="Jira"
    >
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-velox-text">Project Analysis</h1>
            <p className="mt-1 text-sm text-velox-muted">
              Live active and future sprints synchronized from your Jira workspace.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void refetch()} disabled={isLoading}>
            Refresh sprints
          </Button>
        </div>

        {/* Live Scrum Sprints Section */}
        {error ? (
          <Alert variant="error" title="Failed to fetch Jira data" message={error} />
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-velox-border bg-velox-card p-5">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : sprints.length === 0 ? (
          <div className="rounded-lg border border-velox-border bg-velox-card p-8 text-center text-velox-muted">
            No active or future sprints found on board.
          </div>
        ) : (
          <div className="space-y-6">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="overflow-hidden rounded-lg border border-velox-border bg-velox-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-velox-border bg-velox-elevated px-5 py-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 
                        onClick={() => navigate(`/project-analysis/sprint/${sprint.id}`)}
                        className="text-lg font-bold text-velox-text cursor-pointer hover:text-emerald-400 transition-colors"
                      >
                        {sprint.name}
                      </h2>
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
                    {sprint.goal ? (
                      <p className="mt-1 text-xs text-velox-muted">
                        <span className="font-semibold text-velox-text">Goal:</span> {sprint.goal}
                      </p>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-velox-muted">
                    {sprint.issues.length} {sprint.issues.length === 1 ? 'issue' : 'issues'}
                  </div>
                </div>

                <div className="p-4">
                  {sprint.issues.length === 0 ? (
                    <p className="text-xs italic text-velox-muted">No issues assigned to this sprint.</p>
                  ) : (
                    <ul className="divide-y divide-velox-border/50">
                      {sprint.issues.map((issue: any) => (
                        <li key={issue.id} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 font-mono font-semibold text-emerald-400">
                              {issue.key}
                            </span>
                            <span className="truncate font-medium text-velox-text">
                              {issue.summary}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 font-mono text-[11px]">
                            {issue.story_points ? (
                              <span className="rounded bg-velox-soft px-1.5 py-0.5 text-velox-muted">
                                {issue.story_points} pts
                              </span>
                            ) : null}
                            <span className="rounded border border-velox-border bg-velox-bg px-2 py-0.5 text-velox-muted">
                              {issue.status}
                            </span>
                            <span className="font-sans text-velox-muted">
                              {issue.assignee ? `@${issue.assignee}` : 'Unassigned'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics & Projection Mock Section */}
        <div className="space-y-4 pt-4 border-t border-velox-border/40">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yellow Warning Alert */}
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Warning
                </span>
                <span>
                According to current burndown velocity, completion is trending behind schedule and projected to <strong>exceed the sprint deadline by 3 days</strong>.
                </span>
            </div>

            {/* Total Technical Debt Dummy */}
            <div className="flex flex-col justify-center rounded-lg border border-velox-border bg-velox-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Soon
                  </span>
                  <h3 className="text-xs font-semibold text-velox-muted uppercase tracking-wider">Total Technical Debt</h3>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-rose-400">42</span>
                    <span className="text-sm text-velox-muted mb-1">Story Points</span>
                </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Burndown Chart Card */}
            <div className="flex flex-col justify-between rounded-lg border border-velox-border bg-velox-card p-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Soon
                  </span>
                  <h3 className="text-sm font-bold text-velox-text">Sprint Burndown</h3>
                </div>
                <p className="text-xs text-velox-muted">Remaining story points vs ideal velocity</p>

                {/* Mock Chart Visual */}
                <div className="relative mt-4 h-36 w-full border-b border-l border-velox-border/60 p-2">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="10" x2="100" y2="90" stroke="currentColor" className="text-velox-muted/40" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M 0 10 L 25 25 L 50 35 L 75 68 L 100 88" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  </svg>
                  <div className="absolute inset-x-0 -bottom-5 flex justify-between text-[10px] font-mono text-velox-muted">
                    <span>Day 1</span>
                    <span>Day 7</span>
                    <span>Day 14 (Target)</span>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-[11px] font-mono text-velox-muted">
                Actual scope burn (amber) is exceeding the target trajectory (dashed).
              </p>
            </div>

            {/* Release Timeline Card */}
            <div className="flex flex-col justify-between rounded-lg border border-velox-border bg-velox-card p-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Soon
                  </span>
                  <h3 className="text-sm font-bold text-velox-text">Release Timeline</h3>
                </div>
                <p className="text-xs text-velox-muted">Milestone schedule and dependencies</p>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-velox-muted">
                      <span>Backend Infrastructure</span>
                      <span className="text-emerald-400">On Track</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-velox-soft">
                      <div className="h-full w-[75%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-velox-muted">
                      <span>Jira Integration Sync</span>
                      <span className="text-amber-400">Delayed (+3d)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-velox-soft">
                      <div className="ml-[15%] h-full w-[60%] rounded-full bg-amber-500"></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-velox-muted">
                      <span>PR Triage Dashboard</span>
                      <span className="text-velox-muted">Pending</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-velox-soft">
                      <div className="ml-[50%] h-full w-[35%] rounded-full bg-indigo-500/50"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-[11px] font-mono text-velox-muted">
                Automated schedule adjustments based on task blockages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}