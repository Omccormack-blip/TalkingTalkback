import React, { useState, useEffect, useRef } from 'react';
import { ConnectionState } from '../types';
import { RealtimeClient } from '../services/RealtimeClient';
import { ConversationDisplay } from './ConversationDisplay';
import { VoiceVisualizer } from './VoiceVisualizer';

export const VoiceChat: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'assistant' | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  const handleStart = async () => {
    if (isActive) {
      // Stop conversation
      clientRef.current?.disconnect();
      clientRef.current = null;
      setIsActive(false);
      setConnectionState('disconnected');
      setTranscript([]);
      setCurrentSpeaker(null);
    } else {
      // Start conversation
      setIsActive(true);
      setConnectionState('connecting');
      
      clientRef.current = new RealtimeClient(
        (text, role) => {
          setTranscript(prev => [...prev, `${role === 'assistant' ? '🤖' : '👤'} ${text}`]);
          setCurrentSpeaker(role);
        },
        (state) => {
          if (state === 'connected') setConnectionState('connected');
          else if (state === 'error') setConnectionState('error');
          else if (state === 'listening') setCurrentSpeaker('user');
          else if (state === 'processing') setCurrentSpeaker(null);
          else if (state === 'ready') setCurrentSpeaker(null);
        },
        (error) => {
          console.error('Voice chat error:', error);
          setConnectionState('error');
        }
      );
      
      await clientRef.current.connect();
    }
  };

  useEffect(() => {
    // Spacebar to start/stop
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isActive]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const getStatusMessage = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting to assistant...';
      case 'connected':
        return currentSpeaker === 'user' ? 'Listening...' : 
               currentSpeaker === 'assistant' ? 'Assistant speaking...' : 
               'Ready - Speak anytime';
      case 'error':
        return 'Connection error - Please try again';
      default:
        return 'Press SPACE or click to start conversation';
    }
  };

  const getButtonText = () => {
    if (!isActive) return 'Start Conversation';
    if (connectionState === 'connecting') return 'Connecting...';
    return 'End Conversation';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            London Transport Museum
          </h1>
          <h2 className="text-2xl text-white/90">
            Share Your Experience
          </h2>
        </div>

        <VoiceVisualizer 
          isActive={isActive} 
          currentSpeaker={currentSpeaker}
        />

        <div className="text-center mb-8">
          <p className="text-white/80 text-lg mb-4">
            {getStatusMessage()}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleStart}
            className={`px-12 py-6 rounded-full text-xl font-semibold transition-all transform hover:scale-105 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white hover:bg-gray-100 text-purple-700'
            } ${connectionState === 'connecting' ? 'opacity-75 cursor-wait' : ''}`}
            disabled={connectionState === 'connecting'}
          >
            {getButtonText()}
          </button>
        </div>

        <ConversationDisplay messages={transcript} />

        <div className="text-center mt-4">
          <p className="text-white/60 text-sm">
            Press SPACE to {isActive ? 'stop' : 'start'} • Your feedback helps us improve
          </p>
        </div>
      </div>
    </div>
  );
};