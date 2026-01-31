
import { Prospect, WorkspaceVersion } from '../types';

const now = () => Date.now();

export const snapshotWorkspace = (p: Prospect, note: string): Prospect => {
  const v: WorkspaceVersion = {
    id: `ver_${Math.random().toString(16).slice(2)}_${Date.now()}`,
    note: note || 'Snapshot',
    createdAt: now(),
    snapshot: JSON.parse(JSON.stringify(p)),
  };

  return {
    ...p,
    versions: [...(p.versions ?? []), v],
  };
};

export const restoreWorkspace = (p: Prospect, versionId: string): Prospect => {
  const v = (p.versions ?? []).find((x) => x.id === versionId);
  if (!v) return p;

  // On garde l’historique des versions (sinon tu perds tout)
  const restored = v.snapshot as Prospect;
  return {
    ...restored,
    versions: p.versions,
  };
};
