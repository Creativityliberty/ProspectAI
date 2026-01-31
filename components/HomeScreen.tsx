
import React, { useState } from 'react';
import { Plus, Briefcase, ChevronRight, Clock, Target, ArrowRight, Zap, Play, LayoutGrid, List as ListIcon, Calendar } from 'lucide-react';
import { Prospect, AgentRunState } from '../types';
import ScoutPanel from './ScoutPanel';
import CRMPipeline from './CRMPipeline';
import { leadToProspect, mergeProspects } from '../services/scoutToProspects';
import { runBatch } from '../services/batchRunner';
import { runAutopilotBatch } from '../services/autopilotRunner';
import { ensureCRM, setStage, completeFollowUp } from '../services/crm';

interface HomeScreenProps {
  prospects: Prospect[];
  onNewProspect: () => void;
  onOpenProspect: (p: Prospect) => void;
  onUpdateProspects: (prospects: Prospect[]) => void; 
}

const HomeScreen: React.FC<HomeScreenProps> = ({ prospects, onNewProspect, onOpenProspect, onUpdateProspects }) => {
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');

  // Ensure CRM exists for pipeline view
  const prospectsWithCRM = prospects.map(ensureCRM);

  const handleCreateScoutProspects = (leads: any[]) => {
      const newProspects = leads.map(leadToProspect);
      const merged = mergeProspects(prospects, newProspects);
      onUpdateProspects(merged); 
  };

  const handleRunBatch = async () => {
      if (isBatchRunning) return;
      if (!confirm(`Lancer la Factory sur ${prospects.length} prospects ?`)) return;
      setIsBatchRunning(true);
      await runBatch(prospects, (updated) => (window as any).triggerProspectUpdate?.(updated));
      setIsBatchRunning(false);
  };
  
  const handleRunAutopilot = async () => {
      if (isBatchRunning) return;
      setIsBatchRunning(true);
      runAutopilotBatch(prospects, (updated) => (window as any).triggerProspectUpdate?.(updated));
      setIsBatchRunning(false);
      alert('Autopilot cycle completed (Ticks generated).');
  };

  const handleStageChange = (id: string, stage: any) => {
      const p = prospects.find(x => x.id === id);
      if(p) {
          (window as any).triggerProspectUpdate?.(setStage(p, stage));
      }
  };
  
  // Calculate Today's Follow-ups
  const todayFollowUps = prospectsWithCRM
  .flatMap(p => (p.crm?.followUps || []).map(f => ({ p, f })))
  .filter(({ f }) => !f.done && f.dueAt < Date.now());

  return (
    <div className="flex-1 max-w-[1400px] mx-auto w-full p-8 md:p-12 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">LeadSite Factory</h1>
          <p className="text-gray-500 text-lg">Scout · Factory · CRM · Autopilot</p>
        </div>
        <div className="flex gap-4">
           {prospects.length > 0 && (
               <>
               <button 
                onClick={handleRunAutopilot}
                disabled={isBatchRunning}
                className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all ${isBatchRunning ? 'bg-gray-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'}`}
               >
                   <Zap className="w-5 h-5" />
                   Autopilot Tick
               </button>
               <button 
                onClick={handleRunBatch}
                disabled={isBatchRunning}
                className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all ${isBatchRunning ? 'bg-gray-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
               >
                   {isBatchRunning ? <Zap className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                   Run Batch
               </button>
               </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          {/* Scout Panel (Left) */}
          <div className="xl:col-span-3">
             <ScoutPanel onCreateProspects={handleCreateScoutProspects} />
          </div>

          {/* Follow-up Widget (Right) */}
          <div className="xl:col-span-1 bg-amber-50 border border-amber-100 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col h-full max-h-[400px]">
              <div className="flex items-center gap-2 text-amber-800 font-bold mb-4">
                  <Calendar className="w-5 h-5" />
                  <h3>Relances (Aujourd'hui)</h3>
                  <span className="bg-amber-200 text-amber-900 px-2 rounded-full text-xs">{todayFollowUps.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {todayFollowUps.length === 0 ? (
                      <div className="text-sm text-amber-700/50 italic">Rien de prévu aujourd'hui.</div>
                  ) : (
                      todayFollowUps.map(({p, f}) => (
                          <div key={f.id} className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                              <div className="font-bold text-sm truncate">{p.name}</div>
                              <div className="text-xs text-amber-700 mb-2">{f.note || 'Relance planifiée'}</div>
                              <button 
                                onClick={() => (window as any).triggerProspectUpdate?.(completeFollowUp(p, f.id))}
                                className="w-full py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded"
                              >
                                  Marquer Fait
                              </button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* Main Content: List or Pipeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                Workspaces ({prospects.length})
            </h3>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                    <ListIcon className="w-4 h-4" /> Liste
                </button>
                <button 
                    onClick={() => setViewMode('pipeline')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'pipeline' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Pipeline
                </button>
            </div>
        </div>

        {prospects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
            <p className="text-gray-400 font-medium">Aucun prospect.</p>
            <button onClick={onNewProspect} className="mt-4 text-indigo-600 font-bold hover:underline">
                Créer manuellement
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'pipeline' && (
                <CRMPipeline 
                    prospects={prospectsWithCRM} 
                    onMove={handleStageChange} 
                    onOpen={onOpenProspect}
                />
            )}

            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {prospects.map((p) => {
                    const states = p.factoryState ? Object.values(p.factoryState) as AgentRunState[] : [];
                    const doneCount = states.filter(s => s.status === 'done').length;
                    const totalAgents = 6;
                    const progress = (doneCount / totalAgents) * 100;
                    
                    return (
                        <button 
                        key={p.id}
                        onClick={() => onOpenProspect(p)}
                        className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all text-left flex flex-col h-full relative overflow-hidden"
                        >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {(p.name || '').substring(0, 2)}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.autopilot?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
                                {p.autopilot?.status === 'ACTIVE' ? 'AUTO ON' : 'AUTO OFF'}
                            </span>
                        </div>
                        
                        <h4 className="font-bold text-gray-900 mb-1 truncate w-full">{p.name || 'Sans nom'}</h4>
                        <div className="flex items-center gap-2 mb-6">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.hasWebsite ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                 {p.hasWebsite ? 'Site OK' : 'No Site'}
                             </span>
                             <span className="text-xs text-gray-500 truncate">{p.crm?.stage || 'NEW'}</span>
                        </div>
                        
                        <div className="mt-auto w-full">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                            <span>Factory Progress</span>
                            <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-1000" style={{width: `${progress}%`}} />
                            </div>
                        </div>
                        </button>
                    );
                    })}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
