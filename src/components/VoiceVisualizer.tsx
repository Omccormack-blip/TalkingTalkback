import React from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
  currentSpeaker: 'user' | 'assistant' | null;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isActive, 
  currentSpeaker 
}) => {
  const getBars = () => {
    const barCount = 5;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      const animationDelay = `${i * 0.1}s`;
      const height = isActive && currentSpeaker ? '100%' : '20%';
      
      bars.push(
        <div
          key={i}
          className={`w-2 bg-white rounded-full transition-all duration-300 ${
            isActive && currentSpeaker ? 'animate-pulse' : ''
          }`}
          style={{
            height,
            animationDelay,
            opacity: isActive ? 1 : 0.3
          }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className="flex justify-center items-center h-32 mb-8">
      <div className="flex items-center space-x-2 h-16">
        {getBars()}
      </div>
    </div>
  );
};