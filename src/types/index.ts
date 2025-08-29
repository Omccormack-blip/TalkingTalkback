export type AppMode = 'kiosk' | 'admin';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  startTime: Date;
  endTime: Date | null;
  messages: Message[];
  metadata: {
    visitorCount: number;
    topics: string[];
  };
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioVisualizerData {
  volume: number;
  frequency: number[];
}