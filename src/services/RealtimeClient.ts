export class RealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private onTranscript: (text: string, role: 'user' | 'assistant') => void;
  private onStateChange: (state: string) => void;
  private onError: (error: string) => void;

  constructor(
    onTranscript: (text: string, role: 'user' | 'assistant') => void,
    onStateChange: (state: string) => void,
    onError: (error: string) => void
  ) {
    this.onTranscript = onTranscript;
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  async connect() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.onStateChange('connected');
        this.ws?.send(JSON.stringify({ type: 'start' }));
        this.startRecording();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('Connection error');
        this.onStateChange('error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.onStateChange('disconnected');
        this.stopRecording();
      };

    } catch (error) {
      console.error('Connection failed:', error);
      this.onError('Failed to connect');
      this.onStateChange('error');
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connected':
        console.log('Connected with conversation ID:', data.conversationId);
        break;
      
      case 'transcript':
        this.onTranscript(data.text, data.role);
        break;
      
      case 'audio':
        this.queueAudio(data.audio);
        break;
      
      case 'speech_started':
        this.onStateChange('listening');
        break;
      
      case 'speech_stopped':
        this.onStateChange('processing');
        break;
      
      case 'response_complete':
        this.onStateChange('ready');
        break;
      
      case 'error':
        this.onError(data.error);
        break;
    }
  }

  private async startRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const source = this.audioContext!.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext!.createScriptProcessor(2048, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.audioContext!.destination);

      this.processor.onaudioprocess = (e) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = this.float32ToPCM16(inputData);
          const base64 = this.arrayBufferToBase64(pcm16);
          
          this.ws.send(JSON.stringify({
            type: 'audio',
            audio: base64
          }));
        }
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError('Microphone access denied');
    }
  }

  private stopRecording() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  private queueAudio(base64Audio: string) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    
    this.audioQueue.push(float32);
    
    if (!this.isPlaying) {
      this.playQueuedAudio();
    }
  }

  private async playQueuedAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;
    
    const buffer = this.audioContext!.createBuffer(1, audioData.length, 24000);
    buffer.copyToChannel(audioData, 0);
    
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);
    
    source.onended = () => {
      this.playQueuedAudio();
    };
    
    source.start();
  }

  private float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  disconnect() {
    this.stopRecording();
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'stop' }));
      }
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }
}