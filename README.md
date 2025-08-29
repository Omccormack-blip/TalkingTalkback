# Museum Voice Chat - OpenAI Realtime API Integration

An interactive voice conversation kiosk for the London Transport Museum that uses OpenAI's Realtime API to conduct natural conversations with visitors about their museum experience.

## Features

- **Real-time Voice Conversations**: Uses OpenAI's Realtime API for low-latency speech-to-speech conversations
- **Museum Guide Persona**: AI configured to act as an inquisitive museum guide, asking about visitor experiences
- **Automatic Speech Recognition**: Real-time transcription of visitor speech
- **Natural Voice Responses**: AI responds with natural-sounding speech
- **Conversation History**: All conversations are saved and viewable in admin mode
- **Push-to-Talk Interface**: Simple spacebar activation for starting conversations

## Architecture

### Frontend (React + TypeScript)
- **VoiceChat**: Main kiosk interface with voice interaction
- **RealtimeClient**: WebSocket client for OpenAI Realtime API
- **VoiceVisualizer**: Visual feedback during conversations
- **AdminView**: Review saved conversations

### Backend (Node.js + Express)
- **RealtimeService**: Manages OpenAI Realtime API connections
- **ConversationManager**: Stores and retrieves conversation history
- **WebSocket Server**: Bridges frontend to OpenAI API

## Setup

### Prerequisites
- Node.js 18+
- OpenAI API key with Realtime API access
- Microphone-enabled device

### Installation

1. Install dependencies:
```bash
cd museum-voice-chat
npm install
```

2. Configure environment:
```bash
# Edit .env file
OPENAI_API_KEY=your_openai_api_key_here
PORT=5002
```

3. Run development server:
```bash
npm run dev
```

4. Access the application:
   - Voice Kiosk: http://localhost:3001
   - Admin View: Press Ctrl+A to switch modes

## Usage

### Visitor Mode
1. Press SPACE or click "Start Conversation"
2. Speak naturally about your museum visit
3. The AI will ask follow-up questions
4. Press SPACE again to end the conversation

### Admin Mode
- Press Ctrl+A to switch to admin view
- View all conversation transcripts
- See conversation duration and message count
- Export conversation data for analysis

## Museum Guide Behavior

The AI is configured to:
- Ask about specific exhibits, the cafe, gift shop
- Inquire about crowd levels and favorite moments
- Redirect off-topic questions back to the museum experience
- Keep responses brief and conversational
- Use British English
- Thank visitors for their feedback

Example conversation flow:
- AI: "Hello! Welcome to our feedback point. How was your visit to the London Transport Museum today?"
- Visitor: "It was great! I loved the old trains."
- AI: "Wonderful! Which train exhibit stood out most to you? Did you get to explore the underground section?"

## OpenAI Realtime API Configuration

The system uses these Realtime API settings:
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Voice: `alloy`
- Audio format: PCM16 @ 24kHz
- Turn detection: Server VAD with 500ms silence threshold
- Temperature: 0.8 for natural conversation

## Deployment on Render

1. Push to GitHub
2. Connect repository to Render
3. Configure environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 10000
   - `NODE_ENV`: production

## API Endpoints

- `GET /api/health` - Health check with API key status
- `GET /api/conversations/recent` - Get recent conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations/:id/end` - End and save conversation
- `WS /ws` - WebSocket connection for real-time communication

## Cost Considerations

OpenAI Realtime API pricing:
- Text tokens: Standard GPT-4 rates
- Audio tokens: Separate audio pricing
- See [OpenAI Pricing](https://openai.com/pricing) for current rates

Tips to manage costs:
- Use push-to-talk instead of continuous listening
- Set reasonable conversation time limits
- Monitor usage through OpenAI dashboard

## Security Notes

- API key stored in environment variables only
- Conversations stored locally (add database for production)
- No personal information collection
- HTTPS required for microphone access in production

## Troubleshooting

### "Microphone access denied"
- Ensure browser has microphone permissions
- HTTPS required for production deployment

### "OpenAI API key not configured"
- Set OPENAI_API_KEY in .env file
- Restart the server after setting

### Audio issues
- Check browser compatibility (Chrome/Edge recommended)
- Ensure 24kHz sample rate support
- Verify network latency < 200ms for best experience

## Future Enhancements

- Multi-language support
- Sentiment analysis of feedback
- Integration with museum CRM
- Custom voice selection
- Offline mode with fallback
- Analytics dashboard
- Queue management for multiple kiosks