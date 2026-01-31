
import React from 'react';
import { Artifact } from '../types';
import { FileCode, FileJson, FileText, Database, Code, Layout } from 'lucide-react';

const getIcon = (type: string) => {
    switch(type) {
        case 'audit_system': return FileText;
        case 'offer_system': return Database;
        case 'site_spec': return Layout;
        case 'seo_master': return Code;
        default: return FileJson;
    }
}

export default function ArtifactsExplorer(props: {
  artifacts: Artifact[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const items = props.artifacts ?? [];

  if (items.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic text-center py-4">
        Aucun artefact généré.<br/>Lancez un agent pour produire du contenu.
      </div>
    );
  }

  const sorted = items.slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  return (
    <div className="space-y-2">
      {sorted.map((a) => {
        const active = a.id === props.selectedId;
        const Icon = getIcon(a.type);
        return (
          <button
            key={a.id}
            onClick={() => props.onSelect(a.id)}
            className={`w-full text-left px-3 py-3 rounded-lg border text-xs transition-all flex items-start gap-3 ${
              active
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
            }`}
          >
            <div className={`mt-0.5 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-sm mb-0.5">{a.title}</div>
                <div className="text-[10px] text-gray-400 flex items-center justify-between font-mono">
                <span className="uppercase tracking-wider">{a.agent || a.type.split('_')[0]}</span>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">v{a.version ?? 1}</span>
                </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
