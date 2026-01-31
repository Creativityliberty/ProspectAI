
import React, { useState } from 'react';
import { Prospect, FactoryAgentName, AgentRunState, AgentLog } from '../types';
import * as gemini from '../services/geminiService';
import { generateClientPack } from '../utils/exportUtils';
import { 
  Bot, Search, FileText, Briefcase, PenTool, Layout, 
  CheckCircle2, Play, Loader2, AlertCircle, ArrowLeft,
  Download, Copy, Code, Terminal, MessageSquare, Zap,
  Globe, ShieldCheck, FileCode, Layers, ListChecks, ChevronRight, Edit3, Save, Eye,
  Cpu, FileJson, Hash, Smartphone, Monitor, Database, Target
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
    <div className="mt-8 bg-gray-900 rounded-xl overflow-hidden font-mono text-xs text-gray-300 shadow-lg border border-gray-800">
      <div className="bg-gray-950 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
         <span className="font-bold text-gray-400">AGENT RUNTIME LOGS</span>
         {status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
      </div>
      <div className="p-4 space-y-4">
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
  const [protoSubTab, setProtoSubTab] = useState<'preview' | 'framework' | 'files'>('preview');

  const isCollectorDone = prospect.factoryState?.Collector?.status === 'done';
  const isNormalizerDone = prospect.factoryState?.Normalizer?.status === 'done';
  const isPipelineStarted = prospect.factoryState?.PainFinder?.status !== 'waiting';

  const updateAgentState = (agent: FactoryAgentName, state: Partial<AgentRunState>) => {
    const newState = {
      ...prospect.factoryState,
      [agent]: { ...(prospect.factoryState?.[agent] || { status: 'waiting' }), ...state }
    };
    onUpdateProspect({ ...prospect, factoryState: newState });
  };

  const runAgentSequence = async (agentId: FactoryAgentName) => {
    setRunningAgent(agentId);
    updateAgentState(agentId, { status: 'running' });

    try {
      const result = await gemini.runAgent(agentId, prospect);
      const logs = (result as any)._logs;
      const cleanResult = { ...result };
      delete (cleanResult as any)._logs;

      const updatedProspect = { ...prospect, ...cleanResult };
      
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
      await generateClientPack(prospect);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const renderAgentStatus = (agentId: FactoryAgentName) => {
    const state = prospect.factoryState?.[agentId];
    if (!state || state.status === 'waiting') return <div className="w-2 h-2 rounded-full bg-gray-200" />;
    if (state.status === 'running') return <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />;
    if (state.status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <div className="w-2 h-2 rounded-full bg-red-400" />;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#fcfcfc] flex flex-col font-sans">
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            {prospect.name} <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono uppercase">Workspace</span>
          </h2>
        </div>
        <button 
             onClick={handleExport}
             disabled={isExporting || !isPipelineStarted}
             className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
           >
             {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
             Exporter Modules
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chaîne de Production</h3>
            <div className="relative pl-4 border-l border-gray-100 space-y-6">
               <div onClick={() => setActiveTab('overview')} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === 'overview' ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2"><ListChecks className="w-4 h-4" /><span className="text-sm font-bold">Mission Board</span></div>
                  </div>
               </div>
              {agents.map((agent) => (
                <div key={agent.id} onClick={() => prospect.factoryState?.[agent.id]?.status === 'done' && setActiveTab(agent.id)} className={`relative pl-6 cursor-pointer group transition-all ${activeTab === agent.id ? 'opacity-100' : 'opacity-70'}`}>
                  <div className={`p-3 rounded-xl border transition-all ${activeTab === agent.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2"><agent.icon className="w-4 h-4" /><span className="text-sm font-semibold">{agent.label}</span></div>
                      {renderAgentStatus(agent.id)}
                    </div>
                    {prospect.factoryState?.[agent.id]?.status !== 'done' && prospect.factoryState?.[agent.id]?.status !== 'running' && (
                      <button onClick={(e) => { e.stopPropagation(); runAgentSequence(agent.id); }} disabled={runningAgent !== null} className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase bg-gray-900 text-white rounded mt-2">
                        <Play className="w-3 h-3" /> Exécuter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>

        <div className="flex-1 bg-gray-50 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto pb-20">
              
              {activeTab === 'overview' && (
                <div className="animate-in fade-in space-y-8">
                  {!isCollectorDone && !runningAgent && (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center p-8 bg-white rounded-3xl border border-gray-200 border-dashed">
                       <button onClick={() => runAgentSequence('Collector')} className="px-8 py-4 bg-black text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-xl"><Play className="w-5 h-5" /> Start Factory</button>
                    </div>
                  )}
                   {isCollectorDone && (
                       <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Audit System</div>
                               <div className={`font-bold text-lg ${prospect.audit ? 'text-green-600' : 'text-gray-300'}`}>{prospect.audit ? 'Généré' : 'En attente'}</div>
                           </div>
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Offer System</div>
                               <div className={`font-bold text-lg ${prospect.offers ? 'text-green-600' : 'text-gray-300'}`}>{prospect.offers ? 'Généré' : 'En attente'}</div>
                           </div>
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Outreach System</div>
                               <div className={`font-bold text-lg ${prospect.outreach ? 'text-green-600' : 'text-gray-300'}`}>{prospect.outreach ? 'Généré' : 'En attente'}</div>
                           </div>
                           <div className="p-4 bg-white rounded-xl border border-gray-200">
                               <div className="font-bold text-gray-500 text-xs uppercase">Framework V1</div>
                               <div className={`font-bold text-lg ${prospect.prototype?.seoMasterFile ? 'text-green-600' : 'text-gray-300'}`}>{prospect.prototype?.seoMasterFile ? 'Généré' : 'En attente'}</div>
                           </div>
                       </div>
                   )}
                </div>
              )}

              {activeTab === 'PainFinder' && prospect.painPoints && (
                <div>
                   <h3 className="text-xl font-bold mb-4">Diagnostic & Audit</h3>
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                      <p className="text-lg text-gray-700">{prospect.painPoints.summary}</p>
                   </div>
                   {prospect.audit && (
                       <JsonPreviewBlock title="Module: Audit System" data={prospect.audit} icon={Target} color="red" />
                   )}
                   <AgentConsole logs={prospect.factoryState?.PainFinder?.logs} status="done" />
                </div>
              )}

              {activeTab === 'OfferBuilder' && (
                  <div>
                      <h3 className="text-xl font-bold mb-4">Offres & Stratégie</h3>
                      {prospect.offers && (
                          <JsonPreviewBlock title="Module: Offer System" data={prospect.offers} icon={Briefcase} color="blue" />
                      )}
                      <AgentConsole logs={prospect.factoryState?.OfferBuilder?.logs} status={prospect.factoryState?.OfferBuilder?.status || 'waiting'} />
                  </div>
              )}

              {activeTab === 'Copywriter' && (
                  <div>
                      <h3 className="text-xl font-bold mb-4">Outreach & CRM</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {prospect.outreach && <JsonPreviewBlock title="Module: Outreach System" data={prospect.outreach} icon={MessageSquare} color="indigo" />}
                        {prospect.crmLogic && <JsonPreviewBlock title="Module: CRM Logic" data={prospect.crmLogic} icon={ListChecks} color="purple" />}
                      </div>
                      <AgentConsole logs={prospect.factoryState?.Copywriter?.logs} status={prospect.factoryState?.Copywriter?.status || 'waiting'} />
                  </div>
              )}

              {activeTab === 'PrototypeDesigner' && prospect.prototype && (
                  <div>
                    <div className="flex border-b border-gray-200 bg-white mb-6">
                        <button onClick={() => setProtoSubTab('preview')} className={`px-4 py-2 ${protoSubTab === 'preview' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}>1. Landing Preview</button>
                        <button onClick={() => setProtoSubTab('framework')} className={`px-4 py-2 ${protoSubTab === 'framework' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}>2. LEADSITE FRAMEWORK™</button>
                        <button onClick={() => setProtoSubTab('files')} className={`px-4 py-2 ${protoSubTab === 'files' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}>3. Master Files</button>
                    </div>

                    {protoSubTab === 'preview' && (
                        <div className="w-full h-[700px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                             <iframe srcDoc={prospect.prototype.pages[0].previewHtml} className="w-full h-full bg-white" title="Preview" />
                        </div>
                    )}

                    {protoSubTab === 'framework' && (
                        <div className="space-y-6">
                            {/* Visual SITEMAP ASCII */}
                            <div className="bg-gray-900 rounded-2xl p-8 shadow-xl">
                                <h4 className="text-green-400 font-mono text-sm mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> 
                                    ARCHITECTURE (ASCII VIEW)
                                </h4>
                                <pre className="font-mono text-xs text-green-300 leading-relaxed whitespace-pre-wrap">
                                    {prospect.prototype.sitemapAscii || "Generating..."}
                                </pre>
                            </div>

                             {/* SEO MASTER FILE */}
                             {prospect.prototype.seoMasterFile && (
                                <JsonPreviewBlock 
                                    title="MASTER SEO FILE (seo_pages.json)" 
                                    data={prospect.prototype.seoMasterFile} 
                                    icon={Globe} 
                                    color="indigo" 
                                />
                             )}
                        </div>
                    )}

                    {protoSubTab === 'files' && (
                        <div className="grid grid-cols-1 gap-6">
                            {prospect.prototype.spec && <JsonPreviewBlock title="Site Spec V1" data={prospect.prototype.spec} icon={Layout} color="gray" />}
                            {prospect.prototype.seoSystem && <JsonPreviewBlock title="Local SEO System" data={prospect.prototype.seoSystem} icon={Target} color="gray" />}
                            {prospect.prototype.blocksSystem && <JsonPreviewBlock title="Content Blocks" data={prospect.prototype.blocksSystem} icon={Database} color="gray" />}
                        </div>
                    )}
                     <AgentConsole logs={prospect.factoryState?.PrototypeDesigner?.logs} status="done" />
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
