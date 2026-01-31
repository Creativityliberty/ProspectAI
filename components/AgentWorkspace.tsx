
import React, { useState, useEffect } from 'react';
import { Prospect, FactoryAgentName, AgentRunState, AgentLog } from '../types';
import * as gemini from '../services/geminiService';
import { runAll, invalidateFrom, ensureWorkspaceDefaults } from '../services/orchestrator';
import { getArtifact, updateArtifactContent } from '../services/artifacts';
import { snapshotWorkspace, restoreWorkspace } from '../services/versioning';
import { generateClientPack } from '../utils/exportUtils';
import { enableAutopilot, stopAutopilot } from '../services/autopilot';
import { dispatchDueMessages } from '../services/dispatch';
import ArtifactsExplorer from './ArtifactsExplorer';
import ArtifactEditor from './ArtifactEditor';
import ReplyInboxPanel from './ReplyInboxPanel';
import { 
  Bot, Search, FileText, Briefcase, PenTool, Layout, 
  CheckCircle2, Play, Loader2, AlertCircle, ArrowLeft,
  Download, Copy, Code, Terminal, MessageSquare, Zap,
  Globe, ShieldCheck, FileCode, Layers, ListChecks, ChevronRight, Edit3, Save, Eye,
  Cpu, FileJson, Hash, Smartphone, Monitor, Database, Target, History, RotateCcw, Send, StopCircle, Rocket,
  Mail, MessageCircle, Eye as EyeIcon, MousePointer
} from 'lucide-react';

interface AgentWorkspaceProps {
  prospect: Prospect;
  onUpdateProspect: (p: Prospect) => void;
  onClose: () => void;
}

const agents: { id: FactoryAgentName; label: string; icon: any; description: string }[] = [
  { id: 'Collector', label: 'Collector', icon: Search, description: 'Extraction' },
  { id: 'Normalizer', label: 'Normalizer', icon: FileText, description: 'Nettoyage' },
  { id: 'PainFinder', label: 'PainFinder', icon: AlertCircle, description: 'Audit & Diag' },
  { id: 'OfferBuilder', label: 'OfferBuilder', icon: Briefcase, description: 'Offres' },
  { id: 'Copywriter', label: 'Copywriter', icon: PenTool, description: 'Outreach & CRM' },
  { id: 'PrototypeDesigner', label: 'PrototypeDesigner', icon: Layout, description: 'Site & SEO' },
];

const AgentConsole: React.FC<{ logs?: AgentLog; status: string }> = ({ logs, status }) => {
  if (!logs && status !== 'running') return null;

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden font-mono text-xs text-gray-300 shadow-lg border border-gray-800 h-full flex flex-col">
      <div className="bg-gray-950 px-4 py-2 border-b border-gray-800 flex items-center justify-between shrink-0">
         <span className="font-bold text-gray-400">AGENT RUNTIME LOGS</span>
         {status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
      </div>
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        {status === 'running' && !logs && (
          <div className="animate-pulse text-green-500">> Initializing Agent Protocol...</div>
        )}
        
        {logs?.plan && (
          <div>
            <div className="text-blue-400 font-bold mb-1">> EXECUTION PLAN</div>
            {logs.plan.map((step, i) => (
              <div key={i} className="pl-4 border-l border-gray-800 flex items-center gap-2">
                 <span className="text-gray-500">{i+1}.</span> {step}
              </div>
            ))}
          </div>
        )}

        {logs?.process && (
          <div>
            <div className="text-yellow-400 font-bold mb-1">> PROCESS STREAM</div>
            {logs.process.map((step, i) => (
              <div key={i} className="pl-4 text-gray-400">{step}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const JsonPreviewBlock: React.FC<{ title: string; data: any; icon?: any; color?: string }> = ({ title, data, icon: Icon, color = 'gray' }) => (
    <div className={`bg-white border border-${color}-200 rounded-xl overflow-hidden shadow-sm mt-4`}>
    <div className={`bg-${color}-50 px-6 py-3 border-b border-${color}-100 flex items-center gap-2`}>
        {Icon && <Icon className={`w-4 h-4 text-${color}-600`} />}
        <span className={`font-mono text-sm font-bold text-${color}-900 uppercase`}>{title}</span>
    </div>
    <div className="p-0">
        <textarea 
            readOnly 
            className={`w-full h-48 p-6 font-mono text-xs text-${color}-900 bg-${color}-50/10 resize-none focus:outline-none`}
            value={JSON.stringify(data || {}, null, 2)}
        />
    </div>
    </div>
);

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({ prospect, onUpdateProspect, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [runningAgent, setRunningAgent] = useState<FactoryAgentName | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('');
  const [artifactTab, setArtifactTab] = useState<'editor' | 'preview'>('editor');

  const safeProspect = ensureWorkspaceDefaults(prospect);
  const isCollectorDone = safeProspect.factoryState?.Collector?.status === 'done';
  const isPipelineStarted = safeProspect.factoryState?.PainFinder?.status !== 'waiting';
  
  // Calculate unhandled inbounds
  const inboundsCount = (safeProspect.inbound || []).length;
  const crmBadge = inboundsCount > 0 ? inboundsCount : null;

  // Determine if active tab is an agent
  const isAgentTab = agents.some(a => a.id === activeTab);
  const currentAgentState = isAgentTab ? safeProspect.factoryState?.[activeTab as FactoryAgentName] : null;
  const currentArtifact = isAgentTab ? (safeProspect.artifacts || []).find(a => a.agent === activeTab) : null;
  
  // Resolve icon for active agent
  const activeAgentDef = agents.find(a => a.id === activeTab);
  const ActiveIcon = activeAgentDef?.icon;

  useEffect(() => {
    const list = safeProspect.artifacts ?? [];
    if (!selectedArtifactId && list.length > 0) {
      const last = list.slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
      if (last) setSelectedArtifactId(last.id);
    }
  }, [safeProspect.artifacts, selectedArtifactId]);

  const updateAgentState = (agent: FactoryAgentName, state: Partial<AgentRunState>) => {
    const newState = {
      ...safeProspect.factoryState,
      [agent]: { ...(safeProspect.factoryState?.[agent] || { status: 'waiting' }), ...state }
    };
    onUpdateProspect({ ...safeProspect, factoryState: newState });
  };

  const runPipeline = async () => {
    if (runningAgent) return;
    setRunningAgent('Collector');
    try {
      await runAll(safeProspect, onUpdateProspect, { skipDone: false });
    } finally {
      setRunningAgent(null);
    }
  };

  const runAgentSequence = async (agentId: FactoryAgentName) => {
    const invalidated = invalidateFrom(safeProspect, agentId);
    if (invalidated !== safeProspect) {
        onUpdateProspect(invalidated);
    }

    setRunningAgent(agentId);
    const currentProspect = invalidated;
    updateAgentState(agentId, { status: 'running' });

    try {
      const result = await gemini.runAgent(agentId, currentProspect);
      const logs = (result as any)._logs;
      const cleanResult = { ...result };
      delete (cleanResult as any)._logs;

      const updatedProspect = { ...currentProspect, ...cleanResult };
      
      const newFactoryState = {
        ...updatedProspect.factoryState,
        [agentId]: { 
          status: 'done', 
          output: cleanResult, 
          logs: logs,
          timestamp: Date.now()
        }
      };
      
      onUpdateProspect({ ...updatedProspect, factoryState: newFactoryState });
      if (agentId !== 'Collector' && agentId !== 'Normalizer') {
        setActiveTab(agentId);
      }
    } catch (error) {
      updateAgentState(agentId, { status: 'error', logs: undefined }); 
    } finally {
      setRunningAgent(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateClientPack(safeProspect);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const renderAgentStatus = (agentId: FactoryAgentName) => {
    const state = safeProspect.factoryState?.[agentId];
    if (!state || state.status === 'waiting') return <div className="w-2 h-2 rounded-full bg-gray-200" />;
    if (state.status === 'running') return <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />;
    if (state.status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <div className="w-2 h-2 rounded-full bg-red-400" />;
  };

  // P6: Dispatch Button
  const handleDispatch = async () => {
      const next = await dispatchDueMessages(safeProspect);
      onUpdateProspect(next);
      alert('Dispatch complete. Check Outbox logs.');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#fcfcfc] flex flex-col font-sans">
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              {safeProspect.name} <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono uppercase">Workspace</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono uppercase">
                {safeProspect.workspaceStatus ?? 'INTAKE_RECEIVED'}
              </span>
              {safeProspect.autopilot?.status === 'ACTIVE' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-mono uppercase animate-pulse">
                      Autopilot ON
                  </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={runPipeline}
             disabled={runningAgent !== null}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
           >
             {runningAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
             Run all
           </button>
           
            <button
              onClick={() => {
                const note = prompt('Note snapshot ?') || 'Manual snapshot';
                onUpdateProspect(snapshotWorkspace(safeProspect, note));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all"
            >
              <Save className="w-4 h-4" />
              Snapshot
            </button>

           <button 
             onClick={handleExport}
             disabled={isExporting || !isPipelineStarted}
             className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
           >
             {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
             Export
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chaîne de Production</h3>
            
            {/* Inspector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Inspector</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${safeProspect.warnings && safeProspect.warnings.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-400'}`}>
                    W:{(safeProspect.warnings ?? []).length}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${safeProspect.errors && safeProspect.errors.length > 0 ? 'bg-rose-50 text-rose-800' : 'bg-gray-50 text-gray-400'}`}>
                    E:{(safeProspect.errors ?? []).length}
                  </span>
                </div>
              </div>

              {(safeProspect.warnings ?? []).length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-amber-800 mb-1">Warnings</div>
                  <ul className="list-disc pl-4 text-xs text-amber-800 space-y-1">
                    {(safeProspect.warnings ?? []).slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative pl-4 border-l border-gray-100 space-y-6">
               <div onClick={() => setActiveTab('overview')} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === 'overview' ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2"><ListChecks className="w-4 h-4" /><span className="text-sm font-bold">Mission Board</span></div>
                  </div>
               </div>
               
               <div onClick={() => setActiveTab('artifacts')} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === 'artifacts' ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === 'artifacts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2"><FileCode className="w-4 h-4" /><span className="text-sm font-bold">Documents</span></div>
                  </div>
               </div>

               {/* New CRM Tab with Badge */}
               <div onClick={() => setActiveTab('crm')} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === 'crm' ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === 'crm' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Send className="w-4 h-4" /><span className="text-sm font-bold">Outbox & CRM</span></div>
                        {crmBadge && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                {crmBadge}
                            </span>
                        )}
                    </div>
                  </div>
               </div>

              {agents.map((agent) => (
                <div key={agent.id} onClick={() => safeProspect.factoryState?.[agent.id]?.status === 'done' && setActiveTab(agent.id)} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === agent.id ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === agent.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2"><agent.icon className="w-4 h-4" /><span className="text-sm font-semibold">{agent.label}</span></div>
                      {renderAgentStatus(agent.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        <div className="flex-1 bg-gray-50 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-20 h-full flex flex-col">
              
              {activeTab === 'overview' && (
                <div className="animate-in fade-in space-y-8">
                  {!isCollectorDone && !runningAgent && (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center p-8 bg-white rounded-3xl border border-gray-200 border-dashed">
                       <button onClick={() => runAgentSequence('Collector')} className="px-8 py-4 bg-black text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-xl"><Play className="w-5 h-5" /> Start Factory</button>
                    </div>
                  )}
                   {isCollectorDone && (
                       <div className="grid grid-cols-2 gap-4">
                           {/* Simplified Status View */}
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Output Generation</div>
                               <div className={`font-bold text-lg`}>{safeProspect.artifacts?.length} documents</div>
                           </div>
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Commercial Status</div>
                               <div className={`font-bold text-lg`}>{safeProspect.crm?.stage || 'N/A'}</div>
                           </div>
                       </div>
                   )}
                </div>
              )}
              
              {activeTab === 'artifacts' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                      <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1 overflow-y-auto custom-scrollbar">
                        <ArtifactsExplorer
                          artifacts={safeProspect.artifacts ?? []}
                          selectedId={selectedArtifactId}
                          onSelect={setSelectedArtifactId}
                        />
                      </div>
                      {(safeProspect.versions ?? []).length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                          <div className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Versions</div>
                          <div className="space-y-2">
                            {(safeProspect.versions ?? []).slice(0, 5).map((v) => (
                                <div key={v.id} className="text-xs">{v.note}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-8 flex flex-col h-full">
                      <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1 h-full shadow-sm">
                        {artifactTab === 'editor' ? (
                          <div className="h-full">
                            <ArtifactEditor
                                artifact={getArtifact(safeProspect, selectedArtifactId)}
                                onSave={(nextContent) => {
                                onUpdateProspect(updateArtifactContent(safeProspect, selectedArtifactId, nextContent));
                                }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
              )}

              {/* P6: CRM & Outbox Tab + P8: Reply Handler */}
              {activeTab === 'crm' && (
                  <div className="space-y-8">
                      {/* P8: Reply Inbox */}
                      <ReplyInboxPanel prospect={safeProspect} onUpdateProspect={onUpdateProspect} />

                      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <div>
                              <h3 className="text-lg font-bold">Autopilot Controller</h3>
                              <p className="text-xs text-gray-500">
                                  Current Status: <span className="font-bold">{safeProspect.autopilot?.status || 'OFF'}</span> 
                                  {safeProspect.autopilot?.status === 'ACTIVE' && ` • Step ${safeProspect.autopilot.currentStepIndex + 1}/${safeProspect.autopilot.steps.length}`}
                              </p>
                          </div>
                          <button
                            onClick={() => onUpdateProspect(safeProspect.autopilot?.status === 'ACTIVE' ? stopAutopilot(safeProspect) : enableAutopilot(safeProspect))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${safeProspect.autopilot?.status === 'ACTIVE' ? 'bg-red-50 text-red-600' : 'bg-emerald-600 text-white'}`}
                          >
                              {safeProspect.autopilot?.status === 'ACTIVE' ? <StopCircle className="w-4 h-4"/> : <Rocket className="w-4 h-4"/>}
                              {safeProspect.autopilot?.status === 'ACTIVE' ? 'Stop Autopilot' : 'Start Autopilot'}
                          </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg flex items-center gap-2"><Send className="w-4 h-4"/> Outbox (Queue)</h3>
                             <button
                                onClick={handleDispatch}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                             >
                                 Dispatch Due Messages
                             </button>
                          </div>

                          {(safeProspect.outbox ?? []).length === 0 ? (
                            <div className="text-sm text-gray-400 italic text-center py-8">Outbox vide.</div>
                          ) : (
                            <div className="space-y-3">
                              {(safeProspect.outbox ?? []).slice().reverse().map((m) => (
                                <div key={m.id} className="text-xs border border-gray-100 rounded-xl p-4 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                     <div className="flex gap-2">
                                         <span className="font-mono bg-white border border-gray-200 px-1.5 rounded uppercase">{m.channel}</span>
                                         <span className={`font-bold ${m.status === 'SENT' ? 'text-green-600' : m.status === 'QUEUED' ? 'text-indigo-600' : 'text-gray-500'}`}>{m.status}</span>
                                     </div>
                                     <div className="flex gap-4">
                                         {/* P7: Tracking Stats */}
                                         {m.tracking && (
                                             <div className="flex gap-2 text-[10px] text-gray-500 font-mono items-center">
                                                 <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3"/> {m.tracking.opens}</span>
                                                 <span className="flex items-center gap-1"><MousePointer className="w-3 h-3"/> {m.tracking.clicks}</span>
                                             </div>
                                         )}
                                         <span className="text-gray-400 font-mono">{new Date(m.createdAt).toLocaleString()}</span>
                                     </div>
                                  </div>
                                  <div className="font-semibold mb-1">
                                    To: {m.channel === 'email' ? m.to.email : m.to.phoneE164}
                                  </div>
                                  {m.subject && <div className="text-gray-700 font-medium mb-1">{m.subject}</div>}
                                  <div className="text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border border-gray-100">{m.body}</div>
                                  {m.error && <div className="text-rose-600 mt-2 font-mono bg-rose-50 p-1 rounded">Error: {m.error}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                  </div>
              )}

              {/* AGENT TABS: Generic View for All Agents */}
              {isAgentTab && (
                <div className="h-full flex flex-col animate-in fade-in duration-300">
                   <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                               {ActiveIcon && <ActiveIcon className="w-5 h-5" />}
                           </div>
                           <div>
                               <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
                               <p className="text-xs text-gray-500 font-mono">Module Output & Logs</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                currentAgentState?.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 
                                currentAgentState?.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                                {currentAgentState?.status || 'WAITING'}
                            </span>
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                       {/* Left: Artifact Editor/Preview */}
                       <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                               <span className="font-bold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                  <FileText className="w-3 h-3" /> Artifact Content
                               </span>
                               {currentArtifact && <span className="text-[10px] text-gray-400 font-mono">ID: {currentArtifact.id.slice(-6)}</span>}
                           </div>
                           <div className="flex-1 overflow-hidden relative">
                              {currentArtifact ? (
                                 <div className="absolute inset-0">
                                     <ArtifactEditor 
                                        artifact={currentArtifact} 
                                        onSave={(content) => onUpdateProspect(updateArtifactContent(safeProspect, currentArtifact.id, content))} 
                                     />
                                 </div>
                              ) : (
                                 <div className="flex flex-col items-center justify-center h-full text-gray-400 italic p-8 text-center bg-gray-50/50">
                                    <Bot className="w-12 h-12 mb-2 opacity-20" />
                                    <span>Aucun artefact généré pour cet agent.</span>
                                    <span className="text-xs mt-1">Lancez la factory pour produire ce contenu.</span>
                                 </div>
                              )}
                           </div>
                       </div>

                       {/* Right: Logs */}
                       <div className="h-full">
                           <AgentConsole 
                                logs={currentAgentState?.logs} 
                                status={currentAgentState?.status || 'waiting'} 
                           />
                       </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
