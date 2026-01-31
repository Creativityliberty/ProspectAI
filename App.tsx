
import React, { useState, useEffect } from 'react';
import { Prospect } from './types';
import HomeScreen from './components/HomeScreen';
import IntakeScreen from './components/IntakeScreen';
import AgentWorkspace from './components/AgentWorkspace';

// Simple Router Types
type Screen = 'HOME' | 'INTAKE' | 'WORKSPACE';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prospects');
    if (saved) {
      try {
        setProspects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load prospects", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('prospects', JSON.stringify(prospects));
  }, [prospects]);

  const handleCreateWorkspace = (newProspect: Prospect) => {
    setProspects(prev => [newProspect, ...prev]);
    setSelectedProspect(newProspect);
    setCurrentScreen('WORKSPACE');
  };

  const handleOpenProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setCurrentScreen('WORKSPACE');
  };

  const handleUpdateProspect = (updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProspect(updated);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans text-gray-900">
      
      {currentScreen === 'HOME' && (
        <HomeScreen 
          prospects={prospects} 
          onNewProspect={() => setCurrentScreen('INTAKE')}
          onOpenProspect={handleOpenProspect}
        />
      )}

      {currentScreen === 'INTAKE' && (
        <IntakeScreen 
          onBack={() => setCurrentScreen('HOME')}
          onCreateWorkspace={handleCreateWorkspace}
        />
      )}

      {currentScreen === 'WORKSPACE' && selectedProspect && (
        <AgentWorkspace 
          prospect={selectedProspect}
          onUpdateProspect={handleUpdateProspect}
          onClose={() => {
            setSelectedProspect(null);
            setCurrentScreen('HOME');
          }}
        />
      )}
    </div>
  );
};

export default App;
