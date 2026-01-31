import React from 'react';
import { Plus, Briefcase, ChevronRight, Clock, Target, ArrowRight } from 'lucide-react';
import { Prospect, AgentRunState } from '../types';

interface HomeScreenProps {
  prospects: Prospect[];
  onNewProspect: () => void;
  onOpenProspect: (p: Prospect) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ prospects, onNewProspect, onOpenProspect }) => {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">LeadSite Factory</h1>
          <p className="text-gray-500 text-lg">Multi-agents · Emails · Prototype · Export</p>
        </div>
        <div className="flex gap-4">
           {/* Primary Action */}
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Create New Card */}
        <button 
          onClick={onNewProspect}
          className="group relative flex flex-col justify-between h-64 p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all" />
          
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4">
            <Plus className="w-8 h-8" />
          </div>
          
          <div className="text-left relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Nouveau Prospect</h2>
            <p className="text-indigo-100 text-sm">Démarrer un workspace vide</p>
          </div>
          
          <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
             <ArrowRight className="text-white w-6 h-6" />
          </div>
        </button>

        {/* Info Card 1 */}
        <div className="h-64 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
           <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{prospects.length} Workspaces</h2>
            <p className="text-gray-400 text-sm">Prospects actifs en cours</p>
          </div>
        </div>
        
        {/* Info Card 2 */}
        <div className="h-64 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
           <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Récents</h2>
            <p className="text-gray-400 text-sm">Reprendre le travail</p>
          </div>
        </div>
      </div>

      {/* Recent Prospects List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gray-400" />
          Reprendre un workspace
        </h3>

        {prospects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
            <p className="text-gray-400 font-medium">Aucun prospect récent. Lancez votre première mission !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prospects.map((p) => {
              const states = p.factoryState ? Object.values(p.factoryState) as AgentRunState[] : [];
              const doneCount = states.filter(s => s.status === 'done').length;
              const totalAgents = 6;
              const progress = (doneCount / totalAgents) * 100;
              
              return (
                <button 
                  key={p.id}
                  onClick={() => onOpenProspect(p)}
                  className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all text-left flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {p.name.substring(0, 2)}
                    </div>
                    {progress === 100 ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Done</span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">In Progress</span>
                    )}
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-1 truncate w-full">{p.name}</h4>
                  <p className="text-xs text-gray-500 mb-6 truncate w-full">{p.address}</p>
                  
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
      </div>
    </div>
  );
};

export default HomeScreen;