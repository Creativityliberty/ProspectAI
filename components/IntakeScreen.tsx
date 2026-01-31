
import React, { useState, useEffect } from 'react';
import { IntakeData, IntakeMode, Prospect } from '../types';
import { ArrowLeft, Image, Link as LinkIcon, FileText, Check, Loader2, Mic, MicOff } from 'lucide-react';

interface IntakeScreenProps {
  onBack: () => void;
  onCreateWorkspace: (prospect: Prospect) => void;
}

// Add types for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const IntakeScreen: React.FC<IntakeScreenProps> = ({ onBack, onCreateWorkspace }) => {
  const [mode, setMode] = useState<IntakeMode>('mix');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Toilettage');
  const [textInput, setTextInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Audio State
  const [isListening, setIsListening] = useState<'none' | 'textInput' | 'notes'>('none');

  const startListening = (target: 'textInput' | 'notes') => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(target);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (target === 'textInput') {
        setTextInput(prev => prev + (prev ? ' ' : '') + transcript);
      } else {
        setNotes(prev => prev + (prev ? ' ' : '') + transcript);
      }
      setIsListening('none');
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening('none');
    };

    recognition.onend = () => {
      setIsListening('none');
    };

    recognition.start();
  };

  const handleCreate = () => {
    setIsLoading(true);
    
    // Create the Intake Payload
    const intake: IntakeData = {
      mode,
      prospectName: name,
      city,
      category,
      images: [], // Images would be handled here in a real app
      textBlocks: textInput ? [{ origin: 'user_paste', text: textInput }] : [],
      links: [],
      notes
    };

    // Initialize the Prospect Object (Empty State)
    const newProspect: Prospect = {
      id: `P-${Date.now()}`,
      name: name || 'Nouveau Prospect',
      address: city || '',
      hasWebsite: false,
      businessActivity: category,
      intake: intake,
      crmStatus: 'To Contact',
      factoryState: {
        Collector: { status: 'waiting' },
        Normalizer: { status: 'waiting' },
        PainFinder: { status: 'waiting' },
        OfferBuilder: { status: 'waiting' },
        Copywriter: { status: 'waiting' },
        PrototypeDesigner: { status: 'waiting' }
      }
    };

    setTimeout(() => {
      onCreateWorkspace(newProspect);
    }, 500); // Small fake delay for UX
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12 animate-in slide-in-from-right-10 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h1 className="text-3xl font-black text-gray-900">Nouveau Workspace</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Mode Selection */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">1. Mode d'entrée</h3>
            <div className="grid grid-cols-3 gap-4">
               {[
                 { id: 'card', label: 'Carte de visite', icon: Image },
                 { id: 'links', label: 'Web / Liens', icon: LinkIcon },
                 { id: 'mix', label: 'Mix (Recommandé)', icon: FileText }
               ].map((m) => (
                 <button
                   key={m.id}
                   onClick={() => setMode(m.id as IntakeMode)}
                   className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                     mode === m.id 
                     ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                     : 'border-gray-100 hover:border-gray-200 text-gray-500'
                   }`}
                 >
                   <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                   <span className="text-xs font-bold">{m.label}</span>
                 </button>
               ))}
            </div>
          </div>

          {/* 2. Infos Essentielles */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">2. Infos Clés (Optionnel)</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Nom du Prospect</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Sandra Toilettage"
                  className="w-full p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Ville Cible</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex: Gerponville"
                  className="w-full p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2">Secteur / Catégorie</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
                >
                  <option>Toilettage</option>
                  <option>Coiffure</option>
                  <option>Bâtiment / Artisan</option>
                  <option>Restauration / Traiteur</option>
                  <option>Coach Sportif</option>
                  <option>Autre</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Sources */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">3. Données Brutes</h3>
                <button 
                  onClick={() => startListening('textInput')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isListening === 'textInput' 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isListening === 'textInput' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {isListening === 'textInput' ? 'Écoute...' : 'Dicter'}
                </button>
             </div>
            <textarea 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Collez ici le texte brut de la page Facebook, du site web, ou dictez les infos..."
              className={`w-full h-32 p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-mono text-xs leading-relaxed resize-none ${isListening === 'textInput' ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
            />
          </div>
          
           {/* 4. Notes */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">4. Notes Stratégiques</h3>
                <button 
                  onClick={() => startListening('notes')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isListening === 'notes' 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isListening === 'notes' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {isListening === 'notes' ? 'Écoute...' : 'Dicter'}
                </button>
             </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations particulières, angle d'attaque, points faibles détectés..."
              className={`w-full h-24 p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm resize-none ${isListening === 'notes' ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
            />
          </div>

        </div>

        {/* Right Column: Recap & Action */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-900/20 sticky top-32">
            <h2 className="text-xl font-bold mb-6">Récapitulatif</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                <span className="text-indigo-300">Mode</span>
                <span className="font-bold capitalize">{mode}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                <span className="text-indigo-300">Nom</span>
                <span className="font-bold">{name || 'À définir'}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                <span className="text-indigo-300">Secteur</span>
                <span className="font-bold">{category}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                <span className="text-indigo-300">Données</span>
                <span className="font-bold">{textInput ? 'Oui' : 'Non'}</span>
              </div>
            </div>

            <button 
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Créer Workspace
            </button>
            <p className="text-xs text-indigo-300 text-center mt-4">
              Après création, vous devrez lancer l'agent Collector pour extraire les données.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IntakeScreen;
