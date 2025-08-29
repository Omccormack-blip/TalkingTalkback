import React, { useState, useEffect } from 'react';
import { Conversation } from '../types';

export const AdminView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations/recent?limit=20');
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'Ongoing';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Conversation History</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-purple-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-400">
                          {new Date(conv.startTime).toLocaleString()}
                        </div>
                        <div className="font-medium">
                          {conv.messages.length} messages
                        </div>
                        <div className="text-sm text-gray-400">
                          Duration: {formatDuration(conv.startTime, conv.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Conversation Details</h2>
            
            {selectedConversation ? (
              <div className="bg-gray-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <div className="mb-4">
                  <div className="text-sm text-gray-400">
                    ID: {selectedConversation.id}
                  </div>
                  <div className="text-sm text-gray-400">
                    Started: {new Date(selectedConversation.startTime).toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedConversation.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-purple-700/30 ml-4'
                          : 'bg-blue-700/30 mr-4'
                      }`}
                    >
                      <div className="text-xs text-gray-400 mb-1">
                        {msg.role === 'assistant' ? '🤖 Assistant' : '👤 Visitor'}
                      </div>
                      <div className="text-white">
                        {typeof msg.content === 'string' 
                          ? msg.content 
                          : JSON.stringify(msg.content)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Select a conversation to view details
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};