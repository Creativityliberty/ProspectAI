
import React, { useEffect, useMemo, useState } from 'react';
import { Artifact } from '../types';
import { Save, AlertTriangle, Check } from 'lucide-react';

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? '');
  }
}

function safeParse(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ? String(e.message) : 'JSON parse error' };
  }
}

export default function ArtifactEditor(props: {
  artifact?: Artifact;
  onSave: (nextContent: any) => void;
}) {
  const a = props.artifact;

  const initial = useMemo(() => (a ? safeStringify(a.content) : ''), [a?.id]);
  const [text, setText] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(initial);
    setDirty(false);
    setError(null);
  }, [initial]);

  if (!a) return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
          <span>Sélectionnez un artefact à gauche pour l'éditer.</span>
      </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{a.title}</div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
            <span className="uppercase bg-gray-100 px-1.5 rounded">{a.type}</span> 
            <span>Last update: {new Date(a.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <button
          onClick={() => {
            const parsed = safeParse(text);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            setError(null);
            props.onSave(parsed.value);
            setDirty(false);
          }}
          disabled={!dirty}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              dirty 
              ? 'bg-black text-white hover:bg-gray-800 shadow-md' 
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {dirty ? <Save className="w-3 h-3" /> : <Check className="w-3 h-3" />}
          {dirty ? 'Save Version' : 'Saved'}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
              <span className="font-bold block mb-1">JSON Error</span>
              {error}
          </div>
        </div>
      )}

      <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <textarea
            value={text}
            onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
            }}
            className="absolute inset-0 w-full h-full font-mono text-xs p-4 bg-transparent focus:outline-none resize-none"
            spellCheck={false}
        />
      </div>
    </div>
  );
}
