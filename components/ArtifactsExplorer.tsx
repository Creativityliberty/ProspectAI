
import React from 'react';
import { Artifact } from '../types';

export function ArtifactsExplorer(props: {
  artifacts: Artifact[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const items = props.artifacts ?? [];

  if (items.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        Aucun artefact. Lance un agent (ou Run all) pour générer des outputs.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items
        .slice()
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .map((a) => {
          const active = a.id === props.selectedId;
          return (
            <button
              key={a.id}
              onClick={() => props.onSelect(a.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition ${
                active
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold truncate">{a.title}</div>
              <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                <span className="uppercase font-mono">{a.type}</span>
                <span className="font-mono">v{a.version ?? 1}</span>
              </div>
            </button>
          );
        })}
    </div>
  );
}
