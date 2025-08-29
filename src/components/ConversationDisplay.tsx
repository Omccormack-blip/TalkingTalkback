import React, { useEffect, useRef } from 'react';

interface ConversationDisplayProps {
  messages: string[];
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 max-h-64 overflow-y-auto" ref={scrollRef}>
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`text-white/90 ${
              message.startsWith('🤖') ? 'pl-4' : ''
            }`}
          >
            {message}
          </div>
        ))}
      </div>
    </div>
  );
};