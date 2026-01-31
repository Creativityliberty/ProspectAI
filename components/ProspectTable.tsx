import React from 'react';
import { Prospect } from '../types';
import { MapPin, Phone, Star, AlertCircle, CheckCircle2, Copy, ExternalLink, Map, Target, MessageSquare, ArrowRight } from 'lucide-react';

interface ProspectTableProps {
  prospects: Prospect[];
  onOpenWorkspace?: (prospect: Prospect) => void;
}

const ProspectTable: React.FC<ProspectTableProps> = ({ prospects, onOpenWorkspace }) => {
  
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cold': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMapsUrl = (p: Prospect) => {
    if (p.mapsUri) return p.mapsUri;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`;
  };

  return (
    <div className="w-full overflow-hidden bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-black/5">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Entreprise</th>
              <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Présence & Liens</th>
              <th className="px-8 py-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest w-1/3">Stratégie & Arguments</th>
              <th className="px-8 py-6 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prospects.map((p) => (
              <tr key={p.id} className="group hover:bg-gray-50/80 transition-colors">
                {/* Column 1: Info */}
                <td className="px-8 py-6 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900 text-lg">{p.name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{p.address}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                       <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                       <span className="font-bold text-xs">{p.rating || 'N/A'}</span>
                       <span className="text-xs text-gray-400">({p.userRatingCount || 0} avis)</span>
                    </div>
                  </div>
                </td>
                
                {/* Column 2: Status */}
                <td className="px-8 py-6 align-top">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(p.status)}`}>
                    {p.status === 'hot' ? 'Prioritaire' : p.status === 'warm' ? 'Potentiel' : 'Froid'}
                  </span>
                  {p.opportunity && (
                    <div className="mt-2 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                      {p.opportunity}
                    </div>
                  )}
                </td>

                {/* Column 3: Links */}
                <td className="px-8 py-6 align-top">
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 text-sm ${p.hasWebsite ? 'text-green-600' : 'text-red-500 font-bold'}`}>
                      {p.hasWebsite ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {p.hasWebsite ? 'Site Web OK' : 'Pas de Site Web'}
                    </div>
                    
                    <div className="flex flex-col gap-2 items-start">
                        {p.hasWebsite && p.websiteUri && (
                        <a href={p.websiteUri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors hover:bg-indigo-100">
                            <ExternalLink className="w-3 h-3" />
                            Visiter le site
                        </a>
                        )}
                        
                        <a href={getMapsUrl(p)} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-black hover:underline flex items-center gap-1 bg-gray-100 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-200">
                            <Map className="w-3 h-3" />
                            Voir sur Google Maps
                        </a>
                    </div>
                  </div>
                </td>

                {/* Column 4: Strategy */}
                <td className="px-8 py-6 align-top">
                  <div className="space-y-3">
                    {/* Activity */}
                    {p.businessActivity && (
                        <div className="text-sm text-gray-600">
                            <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">Activité:</span><br/>
                            {p.businessActivity}
                        </div>
                    )}

                    {/* Arguments */}
                    {p.keySellingPoints && Array.isArray(p.keySellingPoints) && p.keySellingPoints.length > 0 && (
                         <div>
                            <span className="font-bold text-indigo-500 text-xs uppercase tracking-wide flex items-center gap-1 mb-1">
                                <Target className="w-3 h-3" /> Arguments Clés
                            </span>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                {p.keySellingPoints.map((arg, idx) => (
                                    <li key={idx}>{arg}</li>
                                ))}
                            </ul>
                         </div>
                    )}
                  </div>
                </td>

                {/* Column 5: Actions */}
                <td className="px-8 py-6 align-top text-right">
                  <div className="flex flex-col gap-2 justify-end items-end">
                    <button 
                      onClick={() => onOpenWorkspace && onOpenWorkspace(p)}
                      className="w-full px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      Ouvrir Factory <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => copyToClipboard(`${p.name}\n${p.phone}\nActivité: ${p.businessActivity}`)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      title="Copier les infos"
                    >
                      <Copy className="w-3 h-3" /> Copier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProspectTable;
