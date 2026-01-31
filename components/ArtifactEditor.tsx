
import React, { useEffect, useMemo, useState } from 'react';
import { Artifact } from '../types';

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? '');
  }
}

function safeParse(text: string) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message ? String(e.message) : 'JSON parse error' };
  }
}

export function ArtifactEditor(props: {
  artifact?: Artifact;
  onSave: (nextContent: any) => void;
}) {
  const a = props.artifact;
  const initial = useMemo(() => (a ? safeStringify(a.content) : ''), [a?.id]); // reset on select
  const [text, setText] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(initial);
    setDirty(false);
    setError(null);
  }, [initial]);

  if (!a) {
    return <div className="text-xs text-gray-500 flex items-center justify-center h-full">Sélectionne un artefact dans le menu de gauche pour l'éditer.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-bold text-gray-900">{a.title}</div>
          <div className="text-[11px] text-gray-500 font-mono">
            {a.type} · v{a.version ?? 1}
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
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold disabled:opacity-40 transition-opacity"
        >
          Save
        </button>
      </div>

      {error && (
        <div className="mb-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          JSON invalide : {error}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        className="flex-1 w-full font-mono text-xs p-3 border border-gray-200 rounded-xl bg-white focus:outline-none resize-none"
        spellCheck={false}
      />
    </div>
  );
}
