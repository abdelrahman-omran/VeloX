import {
  DEFAULT_FIXTURE_REPO,
  LinkedProjectSchema,
  ProjectStoreSchema,
  type LinkedProject,
  type ProjectStoreState,
  type WebhookStatus,
  RepoFullNameSchema,
} from '../schemas/project';

const STORAGE_KEY = 'velox.projects.v1';

type Listener = () => void;

const emptyState = (): ProjectStoreState => ({
  projects: [],
  activeProjectId: null,
});

function readStore(): ProjectStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = ProjectStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyState();
  } catch {
    return emptyState();
  }
}

function writeStore(state: ProjectStoreState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = typeof window !== 'undefined' ? readStore() : emptyState();
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setState(next: ProjectStoreState): void {
  state = next;
  writeStore(state);
  emit();
}

export function getProjectStoreSnapshot(): ProjectStoreState {
  return state;
}

export function subscribeProjectStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveProject(): LinkedProject | null {
  if (!state.activeProjectId) return null;
  return state.projects.find((p) => p.id === state.activeProjectId) ?? null;
}

export function getActiveRepoName(fallback = DEFAULT_FIXTURE_REPO): string {
  return getActiveProject()?.full_name ?? fallback;
}

export function linkProject(
  fullNameInput: string,
  webhookStatus: WebhookStatus = 'pending',
): LinkedProject {
  const full_name = RepoFullNameSchema.parse(fullNameInput);
  const existing = state.projects.find(
    (p) => p.full_name.toLowerCase() === full_name.toLowerCase(),
  );

  if (existing) {
    const updated: LinkedProject = {
      ...existing,
      webhook_status: webhookStatus,
    };
    setState({
      projects: state.projects.map((p) => (p.id === existing.id ? updated : p)),
      activeProjectId: existing.id,
    });
    return updated;
  }

  const project = LinkedProjectSchema.parse({
    id: crypto.randomUUID(),
    full_name,
    linked_at: new Date().toISOString(),
    webhook_status: webhookStatus,
  });

  setState({
    projects: [...state.projects, project],
    activeProjectId: project.id,
  });

  return project;
}

export function setActiveProject(id: string): void {
  if (!state.projects.some((p) => p.id === id)) return;
  setState({ ...state, activeProjectId: id });
}

export function removeProject(id: string): void {
  const projects = state.projects.filter((p) => p.id !== id);
  const activeProjectId =
    state.activeProjectId === id
      ? (projects[0]?.id ?? null)
      : state.activeProjectId;
  setState({ projects, activeProjectId });
}

export function updateWebhookStatus(id: string, webhook_status: WebhookStatus): void {
  setState({
    ...state,
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, webhook_status } : p,
    ),
  });
}
