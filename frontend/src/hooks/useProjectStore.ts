import { useSyncExternalStore } from 'react';
import {
  getActiveProject,
  getProjectStoreSnapshot,
  linkProject,
  removeProject,
  setActiveProject,
  subscribeProjectStore,
  updateWebhookStatus,
} from '../lib/projectStore';
import type { LinkedProject, WebhookStatus } from '../schemas/project';

export function useProjectStore() {
  const snapshot = useSyncExternalStore(
    subscribeProjectStore,
    getProjectStoreSnapshot,
    getProjectStoreSnapshot,
  );

  return {
    projects: snapshot.projects,
    activeProjectId: snapshot.activeProjectId,
    activeProject: getActiveProject(),
    linkProject: (fullName: string, webhookStatus?: WebhookStatus): LinkedProject =>
      linkProject(fullName, webhookStatus),
    setActiveProject,
    removeProject,
    updateWebhookStatus,
  };
}
