
import React from 'react';
import { Prospect, CRMStage } from '../types';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

const STAGES: { id: CRMStage; label: string; color: string }[] = [
  { id: 'NEW', label: 'Nouveau', color: 'border-blue-200 bg-blue-50 text-blue-800' },
  { id: 'CONTACTED', label: 'Contacté', color: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
  { id: 'REPLIED', label: 'Répondu', color: 'border-orange-200 bg-orange-50 text-orange-800' },
  { id: 'MEETING_BOOKED', label: 'RDV Fixé', color: 'border-purple-200 bg-purple-50 text-purple-800' },
  { id: 'PROPOSAL_SENT', label: 'Offre Envoyée', color: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
  { id: 'WON', label: 'Gagné', color: 'border-green-200 bg-green-50 text-green-800' },
  { id: 'LOST', label: 'Perdu', color: 'border-gray-200 bg-gray-50 text-gray-800' },
];

export default function CRMPipeline(props: {
  prospects: Prospect[];
  onMove: (id: string, stage: CRMStage) => void;
  onOpen: (p: Prospect) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[600px]">
      {STAGES.map((stage) => {
        const items = props.prospects.filter((p) => (p.crm?.stage || 'NEW') === stage.id);
        
        return (
          <div key={stage.id} className="min-w-[240px] w-[240px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full">
            <div className={`p-3 border-b border-gray-100 font-bold text-xs uppercase flex justify-between items-center ${stage.color.replace('border-', '')}`}>
              <span>{stage.label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-[10px]">{items.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {items.map((p) => (
                <div
                  key={p.id}
                  onClick={() => props.onOpen(p)}
                  className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="font-bold text-sm text-gray-900 truncate mb-1">{p.name}</div>
                  <div className="text-xs text-gray-500 mb-2 truncate">{p.intake?.city || p.address}</div>
                  
                  {p.autopilot?.status === 'ACTIVE' && (
                      <div className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded inline-block mb-2 font-bold">
                          Autopilot ON
                      </div>
                  )}

                  {/* Actions Rapides */}
                  <div className="flex justify-end pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select 
                        className="text-[10px] bg-gray-100 border-none rounded px-1 py-0.5"
                        value={stage.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => props.onMove(p.id, e.target.value as CRMStage)}
                    >
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
