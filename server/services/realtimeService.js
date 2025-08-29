import WebSocket from 'ws';
import { ConversationManager } from './conversationManager.js';

export class RealtimeService {
  constructor(clientWs) {
    this.clientWs = clientWs;
    this.openaiWs = null;
    this.conversationId = null;
    this.isConnected = false;
  }

  async handleMessage(data) {
    switch (data.type) {
      case 'start':
        await this.startSession();
        break;
      case 'audio':
        this.forwardAudio(data.audio);
        break;
      case 'stop':
        this.stopSession();
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  async startSession() {
    if (this.isConnected) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: 'OpenAI API key not configured' 
      }));
      return;
    }

    try {
      this.conversationId = ConversationManager.createConversation();
      
      // Connect to OpenAI Realtime API
      this.openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.openaiWs.on('open', () => {
        console.log('Connected to OpenAI Realtime API');
        this.isConnected = true;
        
        // Configure the session with museum guide persona
        this.openaiWs.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: this.getMuseumInstructions(),
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            tool_choice: 'none',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        }));

        this.clientWs.send(JSON.stringify({ 
          type: 'connected',
          conversationId: this.conversationId
        }));
      });

      this.openaiWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.handleOpenAIMessage(message);
      });

      this.openaiWs.on('error', (error) => {
        console.error('OpenAI WebSocket error:', error);
        this.clientWs.send(JSON.stringify({ 
          type: 'error', 
          error: 'Connection to OpenAI failed' 
        }));
        this.cleanup();
      });

      this.openaiWs.on('close', () => {
        console.log('OpenAI WebSocket closed');
        this.isConnected = false;
        this.clientWs.send(JSON.stringify({ type: 'disconnected' }));
      });

    } catch (error) {
      console.error('Failed to start session:', error);
      this.clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: 'Failed to start conversation' 
      }));
    }
  }

  getMuseumInstructions() {
    return `You are a friendly, inquisitive museum guide at the London Transport Museum. Your role is to gather feedback about visitors' experiences.

IMPORTANT RULES:
1. NEVER answer questions about other topics - only acknowledge and redirect to the museum experience
2. Keep responses under 2 sentences unless specifically about the museum
3. Always ask follow-up questions about their visit
4. Be warm, enthusiastic, and genuinely curious about their experience
5. Use British English and conversational tone

CONVERSATION FLOW:
- Start: "Hello! Welcome to our feedback point. How was your visit to the London Transport Museum today?"
- Ask about specific exhibits, the cafe, the gift shop, crowds, favorite moments
- Questions to explore: What stood out? Was it busy? Did you visit the cafe? Will you return? Who did you come with?
- If they ask unrelated questions: "That's interesting, but I'd love to hear more about your museum visit today!"
- Closing: Always thank them for their feedback

Remember: You're gathering visitor insights, not providing information. Stay focused on their experience.`;
  }

  handleOpenAIMessage(message) {
    switch (message.type) {
      case 'session.created':
        console.log('OpenAI session created');
        break;
      
      case 'session.updated':
        console.log('OpenAI session updated');
        break;
      
      case 'conversation.item.created':
        if (message.item.role === 'user') {
          ConversationManager.addMessage(this.conversationId, 'user', message.item);
        } else if (message.item.role === 'assistant') {
          ConversationManager.addMessage(this.conversationId, 'assistant', message.item);
        }
        break;
      
      case 'response.audio_transcript.delta':
        this.clientWs.send(JSON.stringify({
          type: 'transcript',
          text: message.delta,
          role: 'assistant'
        }));
        break;
      
      case 'response.audio.delta':
        this.clientWs.send(JSON.stringify({
          type: 'audio',
          audio: message.delta,
          role: 'assistant'
        }));
        break;
      
      case 'input_audio_buffer.speech_started':
        this.clientWs.send(JSON.stringify({ type: 'speech_started' }));
        break;
      
      case 'input_audio_buffer.speech_stopped':
        this.clientWs.send(JSON.stringify({ type: 'speech_stopped' }));
        break;
      
      case 'response.done':
        this.clientWs.send(JSON.stringify({ type: 'response_complete' }));
        break;
      
      case 'error':
        console.error('OpenAI error:', message.error);
        this.clientWs.send(JSON.stringify({ 
          type: 'error', 
          error: message.error.message || 'OpenAI error occurred' 
        }));
        break;
      
      default:
        console.log('OpenAI message:', message.type);
    }
  }

  forwardAudio(audioData) {
    if (this.openaiWs && this.isConnected) {
      this.openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData
      }));
    }
  }

  stopSession() {
    if (this.conversationId) {
      ConversationManager.endConversation(this.conversationId);
    }
    this.cleanup();
  }

  cleanup() {
    this.isConnected = false;
    if (this.openaiWs) {
      this.openaiWs.close();
      this.openaiWs = null;
    }
  }
}