import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { VoiceChat } from './components/VoiceChat';
import { AdminView } from './components/AdminView';
import { ModeToggle } from './components/ModeToggle';

function App() {
  const [mode, setMode] = useState<AppMode>('kiosk');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if API key is configured
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHasApiKey(data.hasApiKey))
      .catch(() => setHasApiKey(false));

    // Keyboard shortcut for mode switching
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a' && e.ctrlKey) {
        e.preventDefault();
        setMode(prev => prev === 'kiosk' ? 'admin' : 'kiosk');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (hasApiKey === null) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="bg-red-600 text-white p-8 rounded-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Configuration Required</h2>
          <p>Please set your OPENAI_API_KEY in the .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative">
      {mode === 'kiosk' ? (
        <VoiceChat />
      ) : (
        <AdminView />
      )}
      <ModeToggle currentMode={mode} onModeChange={setMode} />
    </div>
  );
}

export default App;