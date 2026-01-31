
import { Artifact, ArtifactType, FactoryAgentName, Prospect } from '../types';

const now = () => Date.now();

export const makeArtifactId = (type: ArtifactType) =>
  `art_${type}_${Math.random().toString(16).slice(2)}_${Date.now()}`;

export const upsertArtifact = (p: Prospect, a: Artifact): Prospect => {
  const list = p.artifacts ?? [];
  const idx = list.findIndex((x) => x.id === a.id);

  if (idx === -1) {
    return { ...p, artifacts: [...list, a] };
  }

  const next = [...list];
  next[idx] = a;
  return { ...p, artifacts: next };
};

export const createArtifact = (
  p: Prospect,
  params: {
    type: ArtifactType;
    title: string;
    content: any;
    agent?: FactoryAgentName;
  }
): Prospect => {
  const a: Artifact = {
    id: makeArtifactId(params.type),
    type: params.type,
    title: params.title,
    content: params.content,
    agent: params.agent,
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  };
  return upsertArtifact(p, a);
};

export const updateArtifactContent = (p: Prospect, id: string, content: any): Prospect => {
  const list = p.artifacts ?? [];
  const a = list.find((x) => x.id === id);
  if (!a) return p;

  const updated: Artifact = {
    ...a,
    content,
    version: (a.version ?? 1) + 1,
    updatedAt: now(),
  };
  return upsertArtifact(p, updated);
};

export const getArtifact = (p: Prospect, id: string): Artifact | undefined =>
  (p.artifacts ?? []).find((x) => x.id === id);

export const removeArtifact = (p: Prospect, id: string): Prospect => {
  return { ...p, artifacts: (p.artifacts ?? []).filter((x) => x.id !== id) };
};
