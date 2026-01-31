
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

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const IntakeScreen: React.FC<IntakeScreenProps> = ({ onBack, onCreateWorkspace }) => {
  const [mode, setMode] = useState<IntakeMode>('mix');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Toilettage');
  const [textInput, setTextInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New State for P1
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState('');

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
      images: images, 
      textBlocks: textInput ? [{ origin: 'user_paste', text: textInput }] : [],
      links: links,
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

          {/* New P1: Images */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Sources Images</h3>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;

                const b64s = await Promise.all(files.map(fileToBase64));
                setImages((prev) => [...prev, ...b64s]);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((src, i) => (
                    <div key={i} className="relative aspect-square">
                        <img src={src} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button 
                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center text-[10px]"
                        >
                            X
                        </button>
                    </div>
                ))}
                </div>
            )}
          </div>

           {/* New P1: Liens */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Liens (Web, FB, Maps)</h3>
            <div className="flex gap-2">
                <input
                type="url"
                placeholder="https://facebook.com/..."
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
                />
                <button
                type="button"
                onClick={() => {
                    const url = (linkDraft || '').trim();
                    if (!url) return;
                    setLinks((prev) => [...prev, url]);
                    setLinkDraft('');
                }}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl"
                >
                Ajouter
                </button>
            </div>

            {links.length > 0 && (
                <ul className="mt-3 space-y-2">
                {links.map((u, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-700">
                        <span className="truncate">{u}</span>
                        <button
                            type="button"
                            onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-700 font-bold"
                        >
                            X
                        </button>
                    </li>
                ))}
                </ul>
            )}
            </div>

          {/* 3. Données Brutes (Text) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Données Brutes</h3>
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
              placeholder="Collez ici le texte brut..."
              className={`w-full h-32 p-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-mono text-xs leading-relaxed resize-none ${isListening === 'textInput' ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
            />
          </div>
          
           {/* 4. Notes */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Notes Stratégiques</h3>
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
              placeholder="Observations particulières..."
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
                <span className="text-indigo-300">Sources</span>
                <span className="font-bold">{images.length} images, {links.length} liens</span>
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
