import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  smartFormat?: boolean;
  interimResults?: boolean;
  endpointing?: number;
}

interface TranscriptResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

class DeepgramService {
  private client: any = null;
  private connection: any = null;
  private config: DeepgramConfig;
  private isConnected = false;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  // Event callbacks
  private onTranscriptCallback: ((result: TranscriptResult) => void) | null = null;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onSpeechStartedCallback: (() => void) | null = null;
  private onUtteranceEndCallback: (() => void) | null = null;

  constructor(config: DeepgramConfig) {
    this.config = {
      model: 'nova-2',
      language: 'en',
      smartFormat: true,
      interimResults: true,
      endpointing: 300,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('Deepgram API key is required');
    }

    this.client = createClient(this.config.apiKey);
  }

  // Event listeners
  onTranscript(callback: (result: TranscriptResult) => void) {
    this.onTranscriptCallback = callback;
  }

  onOpen(callback: () => void) {
    this.onOpenCallback = callback;
  }

  onClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  onError(callback: (error: any) => void) {
    this.onErrorCallback = callback;
  }

  onSpeechStarted(callback: () => void) {
    this.onSpeechStartedCallback = callback;
  }

  onUtteranceEnd(callback: () => void) {
    this.onUtteranceEndCallback = callback;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('Connecting to Deepgram with config:', {
        model: this.config.model,
        language: this.config.language,
        smartFormat: this.config.smartFormat,
        interimResults: this.config.interimResults,
        endpointing: this.config.endpointing
      });

      // First test the API key
      console.log('Testing Deepgram API key...');
      const apiKeyValid = await DeepgramService.testApiKey(this.config.apiKey);
      if (!apiKeyValid) {
        throw new Error('Invalid Deepgram API key or connection failed');
      }
      console.log('Deepgram API key is valid');

      this.connection = this.client.listen.live({
        model: this.config.model,
        language: this.config.language,
        smart_format: this.config.smartFormat,
        interim_results: this.config.interimResults,
        endpointing: this.config.endpointing,
        // Add additional parameters for better reliability
        punctuate: true,
        profanity_filter: false,
        redact: false,
        diarize: false,
        multichannel: false,
        alternatives: 1,
        numerals: true,
        search: [],
        replace: [],
        keywords: []
      });

      // Create a promise that resolves when connection is established
      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('Deepgram connection timeout after 15 seconds');
          reject(new Error('Connection timeout after 15 seconds'));
        }, 15000); // Increased timeout

        // Set up event listeners
        this.connection.on(LiveTranscriptionEvents.Open, () => {
          console.log('Deepgram connection opened successfully');
          clearTimeout(timeout);
          this.isConnected = true;
          this.onOpenCallback?.();
          resolve(true);
        });

        this.connection.on(LiveTranscriptionEvents.Error, (error: any) => {
          console.error('Deepgram connection error:', error);
          clearTimeout(timeout);
          this.isConnected = false;
          this.onErrorCallback?.(error);
          reject(new Error(`Deepgram connection error: ${error.message || 'Unknown error'}`));
        });
      });

      // Set up other event listeners
      this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        console.log('Raw transcript data received:', data);
        
        if (data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];
          const transcript = alternative.transcript;
          
          if (transcript && transcript.trim()) {
            const result: TranscriptResult = {
              transcript: transcript.trim(),
              isFinal: data.is_final || false,
              confidence: alternative.confidence || 0
            };
            
            console.log('Calling transcript callback with:', result);
            this.onTranscriptCallback?.(result);
          }
        }
      });

      this.connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
        console.log('Speech started detected');
        this.onSpeechStartedCallback?.();
      });

      this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        console.log('Utterance end detected');
        this.onUtteranceEndCallback?.();
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        this.isConnected = false;
        this.onCloseCallback?.();
      });

      // Wait for connection to be established
      return await connectionPromise;
    } catch (error: any) {
      console.error('Failed to connect to Deepgram:', error);
      this.isConnected = false;
      this.onErrorCallback?.(error);
      throw error; // Re-throw to let caller handle
    }
  }

  async startListening(mediaStream: MediaStream): Promise<boolean> {
    if (!this.isConnected) {
      console.error('Not connected to Deepgram');
      throw new Error('Not connected to Deepgram. Please ensure connection is established first.');
    }

    try {
      this.stream = mediaStream;
      
      // Ensure we have audio tracks
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in media stream');
      }

      console.log('Audio tracks available:', audioTracks.length);
      console.log('Audio track settings:', audioTracks[0].getSettings());
      console.log('Audio track enabled:', audioTracks[0].enabled);
      console.log('Audio track ready state:', audioTracks[0].readyState);
      
      // Verify audio track is actually working
      if (audioTracks[0].readyState === 'ended') {
        console.error('Audio track has ended:', audioTracks[0].readyState);
        throw new Error(`Audio track has ended. Current state: ${audioTracks[0].readyState}`);
      }
      
      if (!audioTracks[0].enabled) {
        console.warn('Audio track is disabled, enabling...');
        audioTracks[0].enabled = true;
        
        // Wait a moment for the track to become active
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Test audio levels to ensure we're getting audio data
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Check if we're getting any audio data
      const hasAudioData = dataArray.some(value => value > 0);
      console.log('Audio data detected:', hasAudioData);
      
      // Clean up audio context
      audioContext.close();
      
      // Create MediaRecorder to capture audio
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Supported MIME type found:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.error('No supported MIME types found. Available types checked:', mimeTypes);
        throw new Error('No supported audio format found for recording');
      }

      console.log('Starting MediaRecorder with MIME type:', selectedMimeType);
      
      // Create MediaRecorder with error handling
      const recorderOptions: MediaRecorderOptions = {
        mimeType: selectedMimeType
      };
      
      // Try to set audio bitrate if supported
      try {
        recorderOptions.audioBitsPerSecond = 16000;
        this.mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);
      } catch (recorderError) {
        console.warn('Failed to create MediaRecorder with audioBitsPerSecond, trying without:', recorderError);
        // Try without audioBitsPerSecond
        try {
          delete recorderOptions.audioBitsPerSecond;
          this.mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);
          console.log('MediaRecorder created without audioBitsPerSecond');
        } catch (fallbackError) {
          console.error('Failed to create MediaRecorder even without audioBitsPerSecond:', fallbackError);
          throw new Error(`Failed to create MediaRecorder: ${fallbackError.message}`);
        }
      }

      let isFirstData = true;
      let dataCount = 0;
      let totalDataSize = 0;

      this.mediaRecorder.ondataavailable = (event) => {
        dataCount++;
        totalDataSize += event.data.size;
        
        if (event.data.size > 0 && this.isConnected && this.connection) {
          if (isFirstData) {
            console.log('First audio data received - size:', event.data.size, 'type:', event.data.type);
            isFirstData = false;
          }
          
          if (dataCount % 50 === 0) { // Log every 50th data packet
            console.log(`Audio data packet ${dataCount} - size: ${event.data.size}, total: ${totalDataSize}`);
          }
          
          try {
            // Send blob directly as per Deepgram documentation
            this.connection.send(event.data);
          } catch (error) {
            console.error('Error sending audio data to Deepgram:', error);
            throw new Error(`Failed to send audio data: ${error.message}`);
          }
        } else if (event.data.size === 0) {
          console.warn('Received empty audio data packet');
        } else if (!this.isConnected) {
          console.warn('Received audio data but not connected to Deepgram');
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const errorMessage = event.error?.message || 'Unknown MediaRecorder error';
        this.onErrorCallback?.(new Error('MediaRecorder error: ' + errorMessage));
        throw new Error('MediaRecorder error: ' + errorMessage);
      };

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };

      // Start recording with smaller chunks for better real-time performance
      console.log('Starting MediaRecorder with 100ms chunks...');
      this.mediaRecorder.start(100); // 100ms chunks
      
      // Wait a moment to ensure recording has started
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (this.mediaRecorder.state !== 'recording') {
        console.error('MediaRecorder state after start attempt:', this.mediaRecorder.state);
        throw new Error(`MediaRecorder failed to start recording - state: ${this.mediaRecorder.state}`);
      }
      
      console.log('MediaRecorder is now recording successfully');
      
      // Set up a timeout to check if we're receiving data
      setTimeout(() => {
        if (dataCount === 0) {
          console.error('No audio data received after 2 seconds');
          this.onErrorCallback?.(new Error('No audio data being captured. Please check microphone permissions and settings.'));
        } else {
          console.log(`Audio data flow confirmed - ${dataCount} packets received`);
        }
      }, 2000);
      
      return true;
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      this.onErrorCallback?.(error);
      throw error; // Re-throw to let caller handle
    }
  }

  stopListening() {
    console.log('Stopping Deepgram listening...');
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  disconnect() {
    console.log('Disconnecting from Deepgram...');
    
    this.stopListening();
    
    if (this.connection) {
      try {
        this.connection.requestClose();
      } catch (error) {
        console.warn('Error closing connection:', error);
      }
      this.connection = null;
    }
    
    this.isConnected = false;
  }

  isConnectionOpen(): boolean {
    return this.isConnected;
  }

  // Static method to test API key
  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Deepgram API key with REST API...');
      
      // First test with REST API
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Deepgram API key validated via REST API');
        return true;
      } else {
        console.error('❌ REST API validation failed:', response.status, await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ REST API test failed, trying WebSocket connection:', error);
      
      // Fallback to WebSocket test
      try {
        const client = createClient(apiKey);
        
        // Test with a simple live connection
        const connection = client.listen.live({
          model: 'nova-2',
          language: 'en',
          smart_format: true,
          interim_results: false
        });

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('WebSocket API key test timeout after 8 seconds');
            try {
              connection.requestClose();
            } catch (error) {
              console.warn('Error closing test connection:', error);
            }
            resolve(false);
          }, 8000);

          connection.on(LiveTranscriptionEvents.Open, () => {
            console.log('✅ API key test successful via WebSocket - connection opened');
            clearTimeout(timeout);
            try {
              connection.requestClose();
            } catch (error) {
              console.warn('Error closing test connection:', error);
            }
            resolve(true);
          });

          connection.on(LiveTranscriptionEvents.Error, (error: any) => {
            console.error('❌ WebSocket API key test failed - connection error:', error);
            clearTimeout(timeout);
            try {
              connection.requestClose();
            } catch (closeError) {
              console.warn('Error closing test connection:', closeError);
            }
            resolve(false);
          });
        });
      } catch (wsError) {
        console.error('❌ WebSocket API key test failed with exception:', wsError);
        return false;
      }
    }
  }
}

export default DeepgramService;
export type { DeepgramConfig, TranscriptResult };