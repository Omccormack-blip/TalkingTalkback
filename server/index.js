import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { RealtimeService } from './services/realtimeService.js';
import { ConversationManager } from './services/conversationManager.js';
import conversationRoutes from './routes/conversations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

ConversationManager.initialize();

app.use('/api/conversations', conversationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.OPENAI_API_KEY
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  const realtimeService = new RealtimeService(ws);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      await realtimeService.handleMessage(data);
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Failed to process message' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    realtimeService.cleanup();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    realtimeService.cleanup();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set in environment variables');
  }
});