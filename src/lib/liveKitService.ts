// LiveKit Service with Murf AI (TTS) and Deepgram (STT) Integration

interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

interface MurfConfig {
  apiKey: string;
  baseUrl: string;
}

interface DeepgramConfig {
  apiKey: string;
  baseUrl: string;
}

interface BodyLanguageMetrics {
  eyeContact: number;
  facialExpression: 'neutral' | 'positive' | 'negative' | 'confused';
  handGestures: number;
  posture: 'good' | 'slouching' | 'leaning';
  confidence: number;
  engagement: number;
  nervousness: number;
}

interface AIInterviewerPersonality {
  name: string;
  voice: string;
  style: string;
  adaptiveResponses: {
    confident: string[];
    nervous: string[];
    engaged: string[];
    distracted: string[];
  };
}

class LiveKitInterviewService {
  private liveKitConfig: LiveKitConfig;
  private murfConfig: MurfConfig;
  private deepgramConfig: DeepgramConfig;
  private currentRoom: any = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isRecording = false;
  private currentPersonality: AIInterviewerPersonality | null = null;

  constructor() {
    this.liveKitConfig = {
      url: import.meta.env.VITE_LIVEKIT_URL || "wss://fraud-alert-voice-agent-jf1l2mys.livekit.cloud",
      apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || "APIusdvdRdp2edo",
      apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || "M2ZtAVB9eEDVw9VTFjoUgkLzitXGZfhXt2QeKffOxPpA"
    };

    this.murfConfig = {
      apiKey: import.meta.env.VITE_MURF_API_KEY || "ap2_497be65f-2231-4923-b2a8-606d27a678d0",
      baseUrl: "https://api.murf.ai/v1"
    };

    this.deepgramConfig = {
      apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || "fbd22617acd9420c8912b0a033399c9ca05dfd45",
      baseUrl: "https://api.deepgram.com/v1"
    };
  }

  // AI Interviewer Personalities based on role and difficulty
  getInterviewerPersonality(role: string, difficulty: string): AIInterviewerPersonality {
    const personalities = {
      frontend: {
        easy: {
          name: "Sarah",
          voice: "en-US-sarah",
          style: "friendly and encouraging",
          adaptiveResponses: {
            confident: [
              "Great confidence! Let's dive deeper into this topic.",
              "I can see you're comfortable with this. Tell me more about your experience.",
              "Excellent! Your confidence shows. Let's explore a more complex scenario."
            ],
            nervous: [
              "Take your time, there's no rush. Let's break this down step by step.",
              "I can see you're thinking carefully. That's good! What comes to mind first?",
              "No worries at all. Let's approach this from a different angle."
            ],
            engaged: [
              "I love your enthusiasm! Keep going with that thought.",
              "Your engagement is fantastic. What else would you add to that?",
              "Great energy! Let's build on that idea."
            ],
            distracted: [
              "Let's refocus on the question at hand. What are your initial thoughts?",
              "I notice you might be thinking about something else. Let's center back on this topic.",
              "Take a moment to collect your thoughts, then let's continue."
            ]
          }
        },
        medium: {
          name: "Alex",
          voice: "en-US-alex",
          style: "professional and analytical",
          adaptiveResponses: {
            confident: [
              "Solid answer. Now let's test your problem-solving skills with a real scenario.",
              "Good technical understanding. How would you handle edge cases?",
              "I can see your experience. Let's discuss architecture decisions."
            ],
            nervous: [
              "Let's slow down and think through this systematically.",
              "It's okay to take a moment. What's your first instinct here?",
              "Remember, there's no single right answer. What approach would you take?"
            ],
            engaged: [
              "Your passion for frontend development really shows. Tell me about your latest project.",
              "I appreciate your detailed thinking. What challenges did you face?",
              "Great insights! How do you stay updated with frontend trends?"
            ],
            distracted: [
              "Let's focus on the technical aspects of this question.",
              "I'd like to hear your specific approach to this problem.",
              "Can you walk me through your thought process step by step?"
            ]
          }
        },
        hard: {
          name: "Dr. Chen",
          voice: "en-US-chen",
          style: "authoritative and challenging",
          adaptiveResponses: {
            confident: [
              "Impressive. Now let's see how you handle system-level complexity.",
              "Good foundation. How would you scale this to millions of users?",
              "I see you understand the basics. What about performance optimization?"
            ],
            nervous: [
              "This is a senior-level question. Take your time to think it through.",
              "Consider the broader implications. What factors would you evaluate?",
              "Let's break this complex problem into smaller components."
            ],
            engaged: [
              "Your architectural thinking is sound. What trade-offs would you consider?",
              "Excellent analysis. How would you measure success in this implementation?",
              "I appreciate your thorough approach. What risks do you foresee?"
            ],
            distracted: [
              "This requires deep technical focus. Let's concentrate on the core problem.",
              "I need to see your senior-level thinking here. What's your strategy?",
              "Focus on the architectural decisions. How would you design this system?"
            ]
          }
        }
      },
      backend: {
        easy: {
          name: "Mike",
          voice: "en-US-mike",
          style: "patient and supportive",
          adaptiveResponses: {
            confident: [
              "Great! You seem comfortable with backend concepts. Let's explore APIs.",
              "Nice understanding! How would you handle data persistence?",
              "Good grasp of the fundamentals. What about error handling?"
            ],
            nervous: [
              "Backend development can seem complex, but let's start simple.",
              "No pressure! Think about how data flows in a typical application.",
              "Let's take this one step at a time. What do you know about databases?"
            ],
            engaged: [
              "I love your curiosity about backend systems! Tell me more.",
              "Your questions show great thinking. What interests you most?",
              "Fantastic engagement! How do you approach learning new technologies?"
            ],
            distracted: [
              "Let's focus on the server-side logic for this question.",
              "Think about what happens behind the scenes in a web application.",
              "Consider the backend components needed for this functionality."
            ]
          }
        }
      }
    };

    return personalities[role as keyof typeof personalities]?.[difficulty as keyof typeof personalities.frontend] || 
           personalities.frontend.easy;
  }

  // Generate LiveKit token
  async generateToken(roomName: string, participantName: string): Promise<string> {
    try {
      // In a real implementation, this would call your backend
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
          liveKitUrl: this.liveKitConfig.url,
          apiKey: this.liveKitConfig.apiKey,
          apiSecret: this.liveKitConfig.apiSecret
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate LiveKit token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      // Return mock token for development
      return `mock-token-${Date.now()}`;
    }
  }

  // Connect to LiveKit room
  async connectToRoom(roomName: string, token: string): Promise<any> {
    try {
      // In a real implementation, you would use the LiveKit SDK
      // For now, we'll simulate the connection
      console.log('Connecting to LiveKit room:', roomName);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.currentRoom = {
        name: roomName,
        connected: true,
        participants: new Map()
      };

      return this.currentRoom;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      throw error;
    }
  }

  // Text-to-Speech using Murf AI
  async synthesizeSpeech(text: string, voiceId?: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.murfConfig.baseUrl}/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.murfConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_id: voiceId || this.currentPersonality?.voice || 'en-US-sarah',
          format: 'mp3',
          speed: 1.0,
          pitch: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech with Murf AI');
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error with Murf AI TTS:', error);
      // Fallback to Web Speech API or return mock audio
      return this.fallbackTTS(text);
    }
  }

  // Fallback TTS using Web Speech API
  private async fallbackTTS(text: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          // Return empty buffer as we can't capture Web Speech API audio
          resolve(new ArrayBuffer(0));
        };
        
        utterance.onerror = (error) => {
          reject(error);
        };
        
        speechSynthesis.speak(utterance);
      } else {
        reject(new Error('Speech synthesis not supported'));
      }
    });
  }

  // Speech-to-Text using Deepgram
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(`${this.deepgramConfig.baseUrl}/listen`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.deepgramConfig.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio with Deepgram');
      }

      const data = await response.json();
      return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    } catch (error) {
      console.error('Error with Deepgram STT:', error);
      // Fallback to Web Speech API
      return this.fallbackSTT(audioBlob);
    }
  }

  // Fallback STT using Web Speech API
  private async fallbackSTT(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          resolve(transcript);
        };
        
        recognition.onerror = (error: any) => {
          reject(error);
        };
        
        recognition.start();
      } else {
        reject(new Error('Speech recognition not supported'));
      }
    });
  }

  // Start recording audio
  async startRecording(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.isRecording = true;
      return stream;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  // Stop recording and get audio blob
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      const chunks: BlobPart[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        reject(error);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  // Generate adaptive AI response based on body language
  generateAdaptiveResponse(
    baseResponse: string, 
    bodyLanguageMetrics: BodyLanguageMetrics,
    context: string = ''
  ): string {
    if (!this.currentPersonality) {
      return baseResponse;
    }

    let adaptivePrefix = '';
    
    // Analyze body language and choose appropriate response style
    if (bodyLanguageMetrics.confidence > 80 && bodyLanguageMetrics.eyeContact > 70) {
      const responses = this.currentPersonality.adaptiveResponses.confident;
      adaptivePrefix = responses[Math.floor(Math.random() * responses.length)];
    } else if (bodyLanguageMetrics.nervousness > 60 || bodyLanguageMetrics.confidence < 50) {
      const responses = this.currentPersonality.adaptiveResponses.nervous;
      adaptivePrefix = responses[Math.floor(Math.random() * responses.length)];
    } else if (bodyLanguageMetrics.engagement > 75) {
      const responses = this.currentPersonality.adaptiveResponses.engaged;
      adaptivePrefix = responses[Math.floor(Math.random() * responses.length)];
    } else if (bodyLanguageMetrics.eyeContact < 40 || bodyLanguageMetrics.engagement < 50) {
      const responses = this.currentPersonality.adaptiveResponses.distracted;
      adaptivePrefix = responses[Math.floor(Math.random() * responses.length)];
    }

    return adaptivePrefix ? `${adaptivePrefix} ${baseResponse}` : baseResponse;
  }

  // Set current interviewer personality
  setInterviewerPersonality(role: string, difficulty: string): void {
    this.currentPersonality = this.getInterviewerPersonality(role, difficulty);
  }

  // Get current personality info
  getCurrentPersonality(): AIInterviewerPersonality | null {
    return this.currentPersonality;
  }

  // Disconnect from room
  async disconnect(): Promise<void> {
    try {
      if (this.currentRoom) {
        // In real implementation, disconnect from LiveKit room
        console.log('Disconnecting from LiveKit room');
        this.currentRoom = null;
      }

      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Check if currently connected
  isConnected(): boolean {
    return this.currentRoom?.connected || false;
  }

  // Get room info
  getRoomInfo(): any {
    return this.currentRoom;
  }
}

export const liveKitService = new LiveKitInterviewService();