
import React, { useMemo, useState } from 'react';
import { runScoutPipeline } from '../services/scoutPipeline';
import { ScoutLead } from '../types';
import { Target, Search, Plus, ArrowRight, AlertTriangle, Check } from 'lucide-react';

export default function ScoutPanel(props: {
  onCreateProspects: (leads: ScoutLead[]) => void;
}) {
  const [raw, setRaw] = useState('');
  const leads = useMemo(() => runScoutPipeline(raw), [raw]);

  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                 <Search className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-lg text-gray-900">Scout Pro</h3>
                <p className="text-xs text-gray-500">Parsing · Scoring · Tagging</p>
             </div>
        </div>
        <div className="text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {leads.length} leads détectés
        </div>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={`Collez ici une liste brute, export CSV ou copier-coller Maps.\nExemple:\nCoiffure Belle | 12 rue de la Paix 75000 | 0601020304\nGarage Auto - 0145678910 - Lyon\n...`}
        className="w-full h-32 text-xs font-mono border border-gray-200 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none resize-none transition-all"
        spellCheck={false}
      />

      <div className="mt-4 flex justify-between items-center">
        <div className="text-xs text-gray-500 flex items-center gap-2">
            <Target className="w-3 h-3" />
            <span>Tri auto par priorité (Site absent = Score +40)</span>
        </div>
        <button
          onClick={() => props.onCreateProspects(leads)}
          disabled={!leads.length}
          className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer {leads.length} prospects
        </button>
      </div>

      {leads.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Aperçu Top 5</div>
          <div className="space-y-2">
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between bg-gray-50/50">
                <div>
                    <div className="font-bold text-sm text-gray-900">{l.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        {l.phone ? <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Tel</span> : <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> No Tel</span>}
                        <span>•</span>
                        {l.website ? <span className="text-gray-400">Site Web</span> : <span className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">No Website (+40)</span>}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-gray-900">{l.score}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Score</div>
                </div>
              </div>
            ))}
            {leads.length > 5 && (
                <div className="text-center text-xs text-gray-400 italic pt-2">
                    ... et {leads.length - 5} autres
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
