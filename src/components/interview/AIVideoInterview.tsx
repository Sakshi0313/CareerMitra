import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import SimpleInterviewerDisplay from './SimpleInterviewerDisplay';
import { interviewAnalysisService } from '@/lib/interviewAnalysisService';
import DeepgramService, { type TranscriptResult } from '@/lib/deepgramService';
import BodyLanguageDetector, { type BodyLanguageMetrics } from '@/lib/bodyLanguageDetection';
import { toast } from "sonner";
import { aiService } from "@/lib/aiService";
import { sessionManager } from "@/lib/sessionManager";
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Volume2,
  VolumeX,
  Brain,
  MessageSquare,
  Clock,
  AlertTriangle,
  Activity,
  PhoneOff,
  Play,
  Pause,
  CheckCircle,
  ArrowRight,
  User,
  Bot
} from "lucide-react";

interface AIVideoInterviewProps {
  selectedRole: string;
  difficulty: string;
  onInterviewEnd: () => void;
  onAnswerSubmitted: (answer: string, question: any) => void;
}

interface ConversationMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  score?: number;
  analysis?: any;
}

const AIVideoInterview: React.FC<AIVideoInterviewProps> = ({
  selectedRole,
  difficulty,
  onInterviewEnd,
  onAnswerSubmitted
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [bodyLanguageMetrics, setBodyLanguageMetrics] = useState<BodyLanguageMetrics | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number>(0);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isPreparingToListen, setIsPreparingToListen] = useState(false);
  
  // New state for improved question-by-question flow
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionScores, setQuestionScores] = useState<number[]>([]);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState<'waiting' | 'asking' | 'listening' | 'processing' | 'scored' | 'completed'>('waiting');
  const [currentQuestionScore, setCurrentQuestionScore] = useState<number>(0);
  
  // Session management - FIXED: Use useRef to prevent infinite re-renders
  const sessionIdRef = useRef(`video-interview-${Date.now()}`);
  const sessionId = sessionIdRef.current;
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const deepgramServiceRef = useRef<DeepgramService | null>(null);
  const bodyLanguageDetectorRef = useRef<BodyLanguageDetector | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const speechDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioOnlyStreamRef = useRef<MediaStream | null>(null);
  const isProcessingAnswerRef = useRef<boolean>(false);

  // Initialize interview - FIXED: Remove sessionId from dependency array
  useEffect(() => {
    // Register session
    sessionManager.registerSession(sessionId);
    
    initializeInterview();
    return () => {
      // CRITICAL: Ensure complete cleanup on component unmount
      console.log('🔥 Component unmounting - TERMINATING SESSION');
      sessionManager.unregisterSession(sessionId);
      terminateSession();
    };
  }, []); // FIXED: Empty dependency array to prevent infinite re-renders

  const initializeInterview = async () => {
    try {
      console.log('🚀 Starting video interview initialization...');
      
      // Generate questions
      console.log('📝 Generating interview questions...');
      const interviewQuestions = interviewAnalysisService.generateInterviewQuestions(selectedRole, difficulty);
      console.log('✅ Generated', interviewQuestions.length, 'questions');
      setQuestions(interviewQuestions);
      
      // Initialize camera and microphone
      console.log('📹 Initializing camera and microphone...');
      await initializeMedia();
      console.log('✅ Media initialized successfully');
      
      // Start interview
      setIsConnected(true);
      startInterviewTimer();
      console.log('⏰ Interview timer started');
      
      // Welcome message
      console.log('👋 Starting welcome message in 1 second...');
      setTimeout(() => {
        console.log('🎯 Starting interview with welcome message');
        startInterview(interviewQuestions);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to initialize video interview:', error);
      setConnectionError('Failed to initialize camera and microphone. Please check permissions.');
      toast.error('Failed to initialize video interview. Please check camera and microphone permissions.');
    }
  };

  const initializeMedia = async () => {
    try {
      console.log('Requesting media permissions for video interview...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      console.log('Media stream obtained successfully for video interview');
      console.log('Audio tracks:', stream.getAudioTracks().length);
      console.log('Video tracks:', stream.getVideoTracks().length);
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Ensure video plays
        try {
          await localVideoRef.current.play();
          console.log('Video element started playing');
        } catch (playError) {
          console.warn('Video play failed (might be autoplay policy):', playError);
          // Try to play after user interaction
          setTimeout(() => {
            if (localVideoRef.current) {
              localVideoRef.current.play().catch(e => console.warn('Delayed video play failed:', e));
            }
          }, 1000);
        }
      }
      
      // Test audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('Video interview audio track settings:', audioTrack.getSettings());
        console.log('Video interview audio track constraints:', audioTrack.getConstraints());
        console.log('Video interview audio track enabled:', audioTrack.enabled);
        console.log('Video interview audio track ready state:', audioTrack.readyState);
      } else {
        console.error('No audio track found in video interview media stream');
        throw new Error('No audio track available for speech recognition');
      }
      
      // Initialize body language detection after media is ready
      setTimeout(() => {
        initializeBodyLanguageDetection();
      }, 2000);
      
      // Initialize Deepgram connection after media is ready - with longer delay for video
      setTimeout(async () => {
        console.log('Initializing Deepgram for video interview after media setup...');
        const initialized = await initializeDeepgram();
        if (initialized) {
          console.log('Deepgram successfully initialized for video interview');
        } else {
          console.error('Failed to initialize Deepgram for video interview');
        }
      }, 2000); // Increased delay for video mode
      
    } catch (error) {
      console.error('Media initialization error for video interview:', error);
      
      let errorMessage = 'Failed to access camera and microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a microphone and camera.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else {
        errorMessage += error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Create a separate audio-only stream for Deepgram
  const createAudioOnlyStream = async (): Promise<MediaStream> => {
    try {
      console.log('Creating audio-only stream for Deepgram...');
      
      const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      console.log('Audio-only stream created successfully');
      console.log('Audio-only stream tracks:', audioOnlyStream.getAudioTracks().length);
      
      const audioTrack = audioOnlyStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('Audio-only track settings:', audioTrack.getSettings());
        console.log('Audio-only track enabled:', audioTrack.enabled);
        console.log('Audio-only track ready state:', audioTrack.readyState);
      }
      
      return audioOnlyStream;
    } catch (error) {
      console.error('Failed to create audio-only stream:', error);
      throw error;
    }
  };

  const initializeBodyLanguageDetection = () => {
    if (!localVideoRef.current) {
      console.warn('Video element not available for body language detection');
      return;
    }

    try {
      console.log('Initializing body language detection...');
      
      bodyLanguageDetectorRef.current = new BodyLanguageDetector();
      
      // Set up callbacks
      bodyLanguageDetectorRef.current.onUnusualMovement((type: string, message: string) => {
        console.log('Unusual movement detected:', type, message);
        
        // Interrupt current speech and give feedback
        if (isAITalking) {
          speechSynthesis.cancel();
          setIsAITalking(false);
        }
        
        // Speak the feedback message
        setTimeout(() => {
          speakMessage(message);
        }, 500);
      });
      
      bodyLanguageDetectorRef.current.onMetricsUpdate((metrics: BodyLanguageMetrics) => {
        setBodyLanguageMetrics(metrics);
      });
      
      // Start analysis
      bodyLanguageDetectorRef.current.startAnalysis(localVideoRef.current);
      
      console.log('Body language detection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize body language detection:', error);
    }
  };

  const initializeDeepgram = async (): Promise<boolean> => {
    const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    
    if (!deepgramApiKey) {
      console.warn('Deepgram API key not found in environment variables.');
      toast.error('Deepgram API key not configured. Please check your .env file.');
      return false;
    }

    try {
      console.log('Initializing Deepgram service for video interview...');
      
      deepgramServiceRef.current = new DeepgramService({
        apiKey: deepgramApiKey,
        model: 'nova-2',
        language: 'en',
        smartFormat: true,
        interimResults: true,
        endpointing: 500  // Increased for better silence detection
      });

      // Set up event listeners
      deepgramServiceRef.current.onOpen(() => {
        console.log('Deepgram connection established successfully for video interview');
        toast.success('Speech recognition connected!');
      });

      deepgramServiceRef.current.onTranscript((result: TranscriptResult) => {
        console.log('Video interview received transcript:', result);
        
        // Update live transcript for real-time display
        if (result.transcript.trim()) {
          if (result.isFinal) {
            currentTranscriptRef.current += ' ' + result.transcript;
            setLiveTranscript(''); // Clear live transcript when final
            console.log('Updated full transcript:', currentTranscriptRef.current);
            
            // Reset silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            
            // Auto-detect end of speech - stop after 5 seconds of silence for better UX
            // Only auto-stop if we have a substantial answer (at least 50 characters)
            silenceTimerRef.current = setTimeout(() => {
              if (isListening && currentTranscriptRef.current.trim().length > 50) {
                console.log('Auto-stopping due to silence detection (5 seconds)');
                stopListening();
              }
            }, 5000); // Increased to 5 seconds
          } else {
            // Show interim results in live transcript
            setLiveTranscript(result.transcript);
          }
        }
        
        // Also detect speech patterns for better auto-stopping
        if (result.transcript.trim()) {
          // Reset speech detection timer
          if (speechDetectionTimerRef.current) {
            clearTimeout(speechDetectionTimerRef.current);
          }
          
          // If we detect a complete sentence or phrase, prepare to stop
          // Only trigger if we have a substantial answer (at least 30 characters)
          const transcript = result.transcript.toLowerCase();
          const completionIndicators = [
            'thank you', 'that\'s all', 'done', 'finished', 
            'that\'s it', 'complete', 'end', 'that\'s my answer', 'that\'s everything'
          ];
          const hasCompletionIndicator = completionIndicators.some(indicator => transcript.includes(indicator));
          
          if (hasCompletionIndicator && result.isFinal && currentTranscriptRef.current.trim().length > 30) {
            speechDetectionTimerRef.current = setTimeout(() => {
              if (isListening) {
                console.log('Auto-stopping due to completion indicator');
                stopListening();
              }
            }, 3000); // Increased to 3 seconds
          }
        }
      });

      deepgramServiceRef.current.onError((error: any) => {
        console.error('Deepgram service error in video interview:', error);
        // Show specific error messages for better debugging
        if (error.message && error.message.includes('connection')) {
          toast.error('Speech recognition connection lost. Trying to reconnect...');
        } else if (error.message && error.message.includes('auth')) {
          toast.error('Speech recognition authentication failed. Please check API key.');
        } else if (error.message && error.message.includes('microphone')) {
          toast.error('Microphone access issue. Please check permissions and try again.');
        } else {
          console.warn('Deepgram error (non-critical):', error.message);
        }
      });

      deepgramServiceRef.current.onClose(() => {
        console.log('Deepgram connection closed for video interview');
      });

      deepgramServiceRef.current.onSpeechStarted(() => {
        console.log('Speech started detected in video interview');
      });

      deepgramServiceRef.current.onUtteranceEnd(() => {
        console.log('Utterance end detected in video interview');
      });

      // Connect to Deepgram with better error handling
      console.log('Attempting to connect to Deepgram for video interview...');
      
      try {
        const connected = await deepgramServiceRef.current.connect();
        
        if (!connected) {
          throw new Error('Failed to establish connection to Deepgram');
        }

        console.log('Deepgram connected successfully for video interview');
        return true;
      } catch (connectionError: any) {
        console.error('Deepgram connection failed:', connectionError);
        
        // Provide specific error messages based on the error type
        if (connectionError.message.includes('timeout')) {
          toast.error('Connection timeout. Please check your internet connection and try again.');
        } else if (connectionError.message.includes('Invalid') || connectionError.message.includes('auth')) {
          toast.error('Invalid API key. Please check your Deepgram configuration.');
        } else if (connectionError.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Connection failed: ${connectionError.message}`);
        }
        
        return false;
      }
    } catch (error: any) {
      console.error('Failed to initialize Deepgram for video interview:', error);
      toast.error(`Deepgram initialization failed: ${error.message}`);
      return false;
    }
  };

  const startInterviewTimer = () => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setInterviewDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const startInterview = async (interviewQuestions: any[]) => {
    console.log('🎬 Starting video interview with', interviewQuestions.length, 'questions');
    
    const welcomeMessage = `Hello! I'm your AI interviewer for this ${selectedRole} position at ${difficulty} level. I can see and hear you clearly. We'll have a natural conversation with ${interviewQuestions.length} questions. Let's begin!`;
    
    console.log('🗣️ Speaking welcome message...');
    await speakMessage(welcomeMessage);
    console.log('✅ Welcome message completed');
    
    // Add to conversation
    addToConversation('ai', welcomeMessage);
    
    // Start with first question after welcome and set the index
    console.log('⏳ Waiting 3 seconds before first question...');
    setTimeout(() => {
      console.log('❓ Starting first question');
      setQuestionIndex(0); // Explicitly set to 0 for first question
      askQuestion(interviewQuestions[0]);
    }, 3000);
  };

  const speakMessage = async (message: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsAITalking(true);
      sessionManager.setSpeechActive(true);
      
      // Cancel any existing speech
      speechSynthesis.cancel();
      
      // Wait for voices to be loaded
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = isSpeakerEnabled ? 1.0 : 0.0;
        
        // Try to use a professional voice
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        if (voices.length > 0) {
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.lang.startsWith('en')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('Using voice:', preferredVoice.name);
          } else {
            console.log('Using default voice:', voices[0].name);
            utterance.voice = voices[0];
          }
        }
        
        utterance.onstart = () => {
          console.log('Speech started:', message.substring(0, 50) + '...');
        };
        
        utterance.onend = () => {
          console.log('AI speech completed');
          setIsAITalking(false);
          sessionManager.setSpeechActive(false);
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsAITalking(false);
          sessionManager.setSpeechActive(false);
          resolve();
        };
        
        speechSynthesisRef.current = utterance;
        speechSynthesis.speak(utterance);
        
        console.log('AI started speaking:', message.substring(0, 50) + '...');
      };
      
      // Check if voices are already loaded
      if (speechSynthesis.getVoices().length > 0) {
        speak();
      } else {
        // Wait for voices to load
        console.log('Waiting for speech synthesis voices to load...');
        speechSynthesis.onvoiceschanged = () => {
          console.log('Voices loaded, starting speech');
          speak();
        };
        
        // Fallback timeout in case voices don't load
        setTimeout(() => {
          if (speechSynthesis.getVoices().length === 0) {
            console.warn('No voices loaded after timeout, speaking anyway');
          }
          speak();
        }, 2000);
      }
    });
  };

  const askQuestion = async (question: any) => {
    console.log('askQuestion called with:', {
      questionId: question?.id,
      questionText: question?.question,
      currentIndex: questionIndex
    });
    
    // Clear previous transcript to prevent reprocessing old answers
    currentTranscriptRef.current = '';
    setLiveTranscript('');
    
    setCurrentQuestion(question);
    setInterviewPhase('asking');
    setShowNextQuestionButton(false);
    
    const questionText = `Question ${questionIndex + 1} of ${questions.length}: ${question.question}`;
    await speakMessage(questionText);
    
    addToConversation('ai', questionText, true);
    
    // Show preparing to listen indicator
    setIsPreparingToListen(true);
    setInterviewPhase('listening');
    
    // Start listening for answer after question - with longer delay to ensure AI speech is complete
    setTimeout(async () => {
      console.log('Starting to listen for answer to question:', question.question);
      setIsPreparingToListen(false);
      
      // Ensure Deepgram is ready before starting to listen
      try {
        if (!deepgramServiceRef.current || !deepgramServiceRef.current.isConnectionOpen()) {
          console.log('Reinitializing Deepgram connection...');
          const initialized = await initializeDeepgram();
          if (!initialized) {
            console.error('Failed to reinitialize Deepgram');
            return;
          }
        }
        
        await startListening();
      } catch (error) {
        console.error('Error starting listening after question:', error);
        // Try to reinitialize and start again
        setTimeout(async () => {
          try {
            await initializeDeepgram();
            await startListening();
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 1000);
      }
    }, 2000); // Increased delay to 2 seconds
  };

  const startListening = async () => {
    console.log('Attempting to start listening in video interview...');
    
    // Check if we have a media stream
    if (!localStreamRef.current) {
      console.log('No media stream, attempting to initialize media...');
      try {
        await initializeMedia();
        // Wait a moment for media to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Failed to initialize media for listening:', error);
        toast.error('Microphone not available. Please allow microphone access and refresh.');
        return;
      }
    }
    
    // Ensure audio track is enabled and available
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) {
      console.error('No audio track found in media stream');
      toast.error('No audio track available. Please check your microphone.');
      return;
    }
    
    if (!audioTrack.enabled) {
      console.error('Audio track is disabled');
      toast.error('Audio is disabled. Please enable your microphone.');
      return;
    }
    
    console.log('Video interview audio track status:', {
      enabled: audioTrack.enabled,
      readyState: audioTrack.readyState,
      settings: audioTrack.getSettings()
    });
    
    // Check Deepgram service
    if (!deepgramServiceRef.current) {
      console.log('Deepgram not initialized, attempting to initialize...');
      const initialized = await initializeDeepgram();
      
      if (!initialized) {
        toast.error('Failed to initialize speech recognition. Please check your Deepgram API key.');
        return;
      }
      
      // Wait for connection to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!deepgramServiceRef.current.isConnectionOpen()) {
      console.log('Deepgram not connected, attempting to connect...');
      try {
        const connected = await deepgramServiceRef.current.connect();
        
        if (!connected) {
          throw new Error('Failed to establish connection');
        }
        
        // Wait for connection to be fully established
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Connection failed:', error);
        toast.error('Failed to connect to speech recognition service. Please check your internet connection.');
        return;
      }
    }
    
    setIsListening(true);
    currentTranscriptRef.current = '';
    setLiveTranscript(''); // Clear any previous live transcript
    
    try {
      console.log('Starting Deepgram listening for video interview...');
      
      // Create a separate audio-only stream for Deepgram to avoid conflicts with video
      let audioOnlyStream: MediaStream;
      try {
        audioOnlyStream = await createAudioOnlyStream();
        audioOnlyStreamRef.current = audioOnlyStream; // Store reference for cleanup
      } catch (error) {
        console.error('Failed to create audio-only stream:', error);
        throw new Error('Failed to access microphone for speech recognition: ' + error.message);
      }
      
      console.log('Audio-only stream details:', {
        audioTracks: audioOnlyStream.getAudioTracks().length,
        active: audioOnlyStream.active
      });
      
      // Use the audio-only stream for Deepgram instead of the combined video+audio stream
      try {
        const started = await deepgramServiceRef.current.startListening(audioOnlyStream);
        console.log('Deepgram listening started successfully for video interview');
        toast.success('Speech recognition started!');
      } catch (startError: any) {
        // Clean up the audio-only stream if starting failed
        audioOnlyStream.getTracks().forEach(track => track.stop());
        
        console.error('Failed to start Deepgram listening:', startError);
        
        // Provide specific error messages
        if (startError.message.includes('No audio tracks')) {
          throw new Error('No audio input detected. Please check your microphone.');
        } else if (startError.message.includes('not live')) {
          throw new Error('Microphone not ready. Please check permissions and try again.');
        } else if (startError.message.includes('MediaRecorder')) {
          throw new Error('Audio recording failed. Please try refreshing the page.');
        } else if (startError.message.includes('Not connected')) {
          throw new Error('Speech recognition not connected. Please try again.');
        } else {
          throw new Error(`Failed to start speech recognition: ${startError.message}`);
        }
      }
      
      // Auto-stop after 120 seconds to prevent hanging
      setTimeout(() => {
        if (isListening) {
          console.log('Auto-stopping after 120 seconds');
          stopListening();
        }
      }, 120000);
      
    } catch (error) {
      console.error('Failed to start listening in video interview:', error);
      setIsListening(false);
      
      // More specific error messages
      if (error.message && error.message.includes('permission')) {
        toast.error('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your internet connection.');
      } else if (error.message && error.message.includes('auth')) {
        toast.error('Authentication failed. Please check your Deepgram API key.');
      } else {
        toast.error(`Failed to start speech recognition: ${error.message}`);
        
        // Try to reinitialize Deepgram and retry once
        console.log('Attempting to reinitialize Deepgram and retry...');
        setTimeout(async () => {
          try {
            await initializeDeepgram();
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create a new audio-only stream for retry
            const retryAudioStream = await createAudioOnlyStream();
            const retryStarted = await deepgramServiceRef.current?.startListening(retryAudioStream);
            if (retryStarted) {
              setIsListening(true);
              toast.success('Speech recognition restarted successfully!');
            } else {
              // Clean up retry stream if failed
              retryAudioStream.getTracks().forEach(track => track.stop());
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            toast.error('Failed to restart speech recognition. Please refresh the page.');
          }
        }, 2000);
      }
    }
  };

  const stopListening = async () => {
    console.log('Stopping listening...');
    setIsListening(false);
    setLiveTranscript(''); // Clear live transcript
    setIsPreparingToListen(false); // Clear preparing state
    setInterviewPhase('processing');
    
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.stopListening();
    }
    
    // Clean up audio-only stream
    if (audioOnlyStreamRef.current) {
      audioOnlyStreamRef.current.getTracks().forEach(track => track.stop());
      audioOnlyStreamRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    if (speechDetectionTimerRef.current) {
      clearTimeout(speechDetectionTimerRef.current);
    }
    
    // Get the current answer
    const answer = currentTranscriptRef.current.trim();
    setCurrentAnswer(answer);
    
    if (answer && currentQuestion) {
      console.log('Processing answer:', answer);
      
      // Score the answer
      const score = await scoreAnswer(currentQuestion, answer);
      setCurrentQuestionScore(score);
      
      // Update scores array
      const newScores = [...questionScores];
      newScores[questionIndex] = score;
      setQuestionScores(newScores);
      
      // Update total score
      const newTotalScore = newScores.reduce((sum, s) => sum + (s || 0), 0);
      setTotalScore(newTotalScore);
      setAnsweredQuestions(newScores.filter(s => s > 0).length);
      
      // Add to conversation
      addToConversation('user', answer);
      
      // Show score and next question button
      setInterviewPhase('scored');
      setShowNextQuestionButton(true);
      
      // Provide immediate feedback
      const feedbackMessage = score >= 80 ? 
        "Excellent answer! You demonstrated strong knowledge and communication skills." :
        score >= 60 ?
        "Good answer! You covered the key points well." :
        score >= 40 ?
        "Decent answer, but could use more detail and examples." :
        "Your answer needs more depth. Try to provide specific examples and explain your reasoning.";
      
      await speakMessage(feedbackMessage);
      addToConversation('ai', feedbackMessage);
      
    } else {
      console.log('No answer provided or no current question');
      setInterviewPhase('asking');
      setShowNextQuestionButton(true);
    }
    
    // Clear the transcript for next question
    currentTranscriptRef.current = '';
  };

  const scoreAnswer = async (question: any, answer: string): Promise<number> => {
    if (!answer.trim()) return 0;
    
    setIsProcessingAnswer(true);
    
    try {
      console.log('Scoring answer for question:', question.question);
      console.log('Answer:', answer);
      
      // Use a simple scoring algorithm since AI service doesn't have generateResponse
      const score = calculateFallbackScore(question, answer);
      
      console.log('Answer scored using fallback method:', score);
      return score;
    } catch (error) {
      console.error('Error scoring answer:', error);
      // Fallback scoring based on answer length and keywords
      return calculateFallbackScore(question, answer);
    } finally {
      setIsProcessingAnswer(false);
    }
  };

  const calculateFallbackScore = (question: any, answer: string): number => {
    let score = 0;
    const words = answer.trim().split(/\s+/);
    const wordCount = words.length;
    
    // Base score based on answer length
    if (wordCount >= 50) score += 40;
    else if (wordCount >= 30) score += 30;
    else if (wordCount >= 15) score += 20;
    else if (wordCount >= 5) score += 10;
    
    // Check for technical keywords if it's a technical question
    if (question.type === 'technical' && question.skills) {
      const answerLower = answer.toLowerCase();
      const skillsFound = question.skills.filter((skill: string) => 
        answerLower.includes(skill.toLowerCase())
      );
      score += Math.min(30, skillsFound.length * 10);
    }
    
    // Check for structure indicators
    const structureIndicators = ['first', 'second', 'then', 'finally', 'because', 'for example', 'such as'];
    const structureFound = structureIndicators.filter(indicator => 
      answer.toLowerCase().includes(indicator)
    );
    score += Math.min(20, structureFound.length * 5);
    
    // Bonus for complete sentences
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const moveToNextQuestion = async () => {
    setShowNextQuestionButton(false);
    setCurrentAnswer('');
    setCurrentQuestionScore(0);
    
    const nextIndex = questionIndex + 1;
    
    if (nextIndex >= questions.length) {
      // Interview completed
      setInterviewPhase('completed');
      await endInterview();
      return;
    }
    
    // Move to next question
    setQuestionIndex(nextIndex);
    setInterviewPhase('asking');
    
    // Ask the next question
    const nextQuestion = questions[nextIndex];
    await askQuestion(nextQuestion);
  };

  const processUserAnswer = async () => {
    // Prevent duplicate processing
    if (isProcessingAnswerRef.current) {
      console.log('Already processing an answer, skipping duplicate call');
      return;
    }
    
    const transcript = currentTranscriptRef.current.trim();
    
    console.log('processUserAnswer called with transcript:', transcript);
    
    if (!transcript || transcript.length < 10) {
      await speakMessage("I didn't catch that clearly. Could you please repeat your answer?");
      setTimeout(() => startListening(), 2000);
      return;
    }
    
    isProcessingAnswerRef.current = true;
    setIsProcessing(true);
    
    // Add user message to conversation immediately
    const userMessage: ConversationMessage = {
      type: 'user',
      content: transcript,
      timestamp: new Date()
    };
    
    setConversation(prev => {
      const newConversation = [...prev, userMessage];
      // Force scroll after state update
      setTimeout(() => forceScrollToBottom(), 100);
      return newConversation;
    });
    
    try {
      // Analyze answer with AI
      const analysis = await interviewAnalysisService.analyzeAnswer({
        answer: transcript,
        question: currentQuestion,
        role: selectedRole,
        difficulty: difficulty,
        timeSpent: 30 // Approximate
      });
      
      // Update scores
      setCurrentScore(analysis.score);
      setAnsweredQuestions(prev => prev + 1);
      setTotalScore(prev => {
        const newTotal = prev + analysis.score;
        return newTotal;
      });
      
      // Update the user message with score and analysis
      setConversation(prev => {
        const updatedConversation = prev.map(msg => 
          msg === userMessage ? { ...msg, score: analysis.score, analysis } : msg
        );
        // Force scroll after state update
        setTimeout(() => forceScrollToBottom(), 100);
        return updatedConversation;
      });
      
      // Notify parent component
      onAnswerSubmitted(transcript, currentQuestion);
      
      // Generate AI feedback
      let feedback = `Thank you for that answer. `;
      
      if (analysis.score >= 80) {
        feedback += `Excellent response! You scored ${analysis.score}%. `;
      } else if (analysis.score >= 60) {
        feedback += `Good answer, you scored ${analysis.score}%. `;
      } else {
        feedback += `You scored ${analysis.score}%. Let me give you some feedback. `;
      }
      
      // Add specific feedback
      if (analysis.strengths.length > 0) {
        feedback += `Your strengths include: ${analysis.strengths.slice(0, 2).join(' and ')}. `;
      }
      
      if (analysis.improvements.length > 0) {
        feedback += `For improvement, consider: ${analysis.improvements[0]}. `;
      }
      
      await speakMessage(feedback);
      addToConversation('ai', feedback);
      
      // Move to next question or end interview
      setTimeout(() => {
        console.log('Current question index:', questionIndex, 'Total questions:', questions.length);
        
        if (questionIndex < questions.length - 1) {
          const nextIndex = questionIndex + 1;
          console.log('Moving to next question:', nextIndex + 1, 'of', questions.length);
          console.log('Next question will be:', questions[nextIndex]?.question);
          
          setQuestionIndex(nextIndex);
          askQuestion(questions[nextIndex]);
        } else {
          console.log('Interview completed - all questions answered');
          endInterview();
        }
      }, 3000); // Increased delay to 3 seconds to ensure feedback is heard
      
    } catch (error) {
      console.error('Failed to process answer:', error);
      await speakMessage("I had trouble processing your answer. Let's move to the next question.");
      
      setTimeout(() => {
        console.log('Error occurred - current question index:', questionIndex, 'Total questions:', questions.length);
        
        if (questionIndex < questions.length - 1) {
          const nextIndex = questionIndex + 1;
          console.log('Error occurred - moving to next question:', nextIndex + 1, 'of', questions.length);
          console.log('Next question will be:', questions[nextIndex]?.question);
          
          setQuestionIndex(nextIndex);
          askQuestion(questions[nextIndex]);
        } else {
          console.log('Error occurred - ending interview');
          endInterview();
        }
      }, 3000);
    } finally {
      setIsProcessing(false);
      isProcessingAnswerRef.current = false;
    }
  };

  const endInterview = async () => {
    setInterviewPhase('completed');
    
    // Calculate final average score from individual question scores
    const validScores = questionScores.filter(score => score > 0);
    const finalAverageScore = validScores.length > 0 ? 
      Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
    
    console.log('🏁 Ending interview with stats:', {
      questionScores,
      validScores,
      answeredQuestions: validScores.length,
      totalQuestions: questions.length,
      finalAverageScore
    });

    // CRITICAL: IMMEDIATELY stop all speech and voice agents
    console.log('🛑 STOPPING ALL VOICE AGENTS IMMEDIATELY');
    sessionManager.emergencyShutdown();
    
    // Force stop speech synthesis multiple times
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
      for (let i = 0; i < 20; i++) {
        setTimeout(() => speechSynthesis.cancel(), i * 50);
      }
    }
    
    // Set all states to stopped
    setIsAITalking(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPreparingToListen(false);
    
    // Save interview results to localStorage BEFORE cleanup
    const interviewResults = {
      role: selectedRole,
      difficulty,
      questionsAnswered: validScores.length,
      totalQuestions: questions.length,
      averageScore: finalAverageScore,
      questionScores: questionScores,
      duration: interviewDuration,
      timestamp: new Date().toISOString(),
      type: 'video'
    };
    
    try {
      // Save to localStorage to persist scores
      const existingResults = JSON.parse(localStorage.getItem('interviewResults') || '[]');
      existingResults.push(interviewResults);
      localStorage.setItem('interviewResults', JSON.stringify(existingResults));
      localStorage.setItem('lastInterviewResult', JSON.stringify(interviewResults));
      
      console.log('💾 Interview results saved:', interviewResults);
      toast.success(`Interview completed! Final score: ${finalAverageScore}%`);
    } catch (error) {
      console.error('❌ Failed to save interview results:', error);
      toast.error('Failed to save interview results');
    }
    
    // NO FINAL MESSAGE - just terminate immediately to prevent voice agents
    console.log('🔥 TERMINATING SESSION IMMEDIATELY - NO FINAL MESSAGE');
    terminateSession();
    
    // Call the parent cleanup and end callback immediately
    setTimeout(() => {
      onInterviewEnd();
    }, 100); // Very short delay
  };

  const addToConversation = (type: 'ai' | 'user', content: string, isQuestion = false) => {
    const message: ConversationMessage = {
      type,
      content,
      timestamp: new Date(),
      isQuestion
    };
    
    setConversation(prev => {
      const newConversation = [...prev, message];
      // Force scroll after state update
      setTimeout(() => forceScrollToBottom(), 100);
      return newConversation;
    });
  };

  const scrollToBottom = useCallback(() => {
    if (isAutoScrollEnabled && chatScrollRef.current) {
      // For flex-col-reverse, scroll to top (which shows newest messages)
      requestAnimationFrame(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = 0;
        }
      });
    }
  }, [isAutoScrollEnabled]);

  // Force scroll to bottom function for immediate scrolling
  const forceScrollToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      requestAnimationFrame(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = 0;
        }
      });
    }
  }, []);

  // Auto-scroll when conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation, liveTranscript, scrollToBottom]);

  // Auto-scroll when listening state changes
  useEffect(() => {
    scrollToBottom();
  }, [isListening, isAITalking, isProcessing, scrollToBottom]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const forceStopAllSpeech = () => {
    console.log('🛑 FORCE STOPPING ALL SPEECH SYNTHESIS');
    sessionManager.forceStopAllSpeech();
    setIsAITalking(false);
    console.log('✅ All speech synthesis stopped');
  };

  const terminateSession = () => {
    console.log('🔥 TERMINATING VIDEO INTERVIEW SESSION COMPLETELY');
    
    // CRITICAL: Use session manager for comprehensive termination
    sessionManager.emergencyShutdown();
    
    // AGGRESSIVE speech stopping - multiple attempts
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
      // Force cancel multiple times with different delays
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          speechSynthesis.cancel();
        }, i * 50);
      }
    }
    
    // Unregister from session manager
    sessionManager.unregisterSession(sessionId);
    
    // Set all states to stopped
    setIsAITalking(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPreparingToListen(false);
    setInterviewPhase('completed');
    
    // Clear all timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechDetectionTimerRef.current) clearTimeout(speechDetectionTimerRef.current);
    
    // Disconnect all services
    if (deepgramServiceRef.current) {
      try {
        deepgramServiceRef.current.disconnect();
      } catch (error) {
        console.warn('Error disconnecting Deepgram:', error);
      }
      deepgramServiceRef.current = null;
    }
    
    // Stop all media streams
    if (audioOnlyStreamRef.current) {
      audioOnlyStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (error) {
          console.warn('Error stopping audio track:', error);
        }
      });
      audioOnlyStreamRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (error) {
          console.warn('Error stopping media track:', error);
        }
      });
      localStreamRef.current = null;
    }
    
    // Stop body language detection
    if (bodyLanguageDetectorRef.current) {
      try {
        bodyLanguageDetectorRef.current.stopAnalysis();
      } catch (error) {
        console.warn('Error stopping body language detection:', error);
      }
      bodyLanguageDetectorRef.current = null;
    }
    
    // Reset processing flags
    isProcessingAnswerRef.current = false;
    
    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    console.log('🏁 VIDEO SESSION TERMINATED - All voice agents and media stopped');
  };

  const cleanup = () => {
    console.log('🧹 Starting comprehensive cleanup...');
    terminateSession();
    console.log('✅ Cleanup completed');
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.volume = !isSpeakerEnabled ? 1.0 : 0.0;
    }
  };

  const forceStopListening = () => {
    console.log('Force stopping listening...');
    if (isListening) {
      stopListening();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (connectionError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header with Connection Status */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Video Interview
            </span>
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Connecting'}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatDuration(interviewDuration)}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Real-time Scores */}
        <div className="col-span-2 space-y-4">
          {/* Real-time Score Display */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Live Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                <div className={`text-2xl font-bold ${
                  currentQuestionScore >= 80 ? 'text-green-600' :
                  currentQuestionScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {currentQuestionScore || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Current Q</div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="text-center p-2 bg-white rounded shadow-sm">
                  <div className="text-sm font-bold text-green-600">
                    {questionScores.length > 0 ? Math.round(questionScores.filter(s => s > 0).reduce((sum, s) => sum + s, 0) / questionScores.filter(s => s > 0).length) || 0 : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg</div>
                </div>
                <div className="text-center p-2 bg-white rounded shadow-sm">
                  <div className="text-sm font-bold text-purple-600">{questionScores.filter(s => s > 0).length}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
                <div className="text-center p-2 bg-white rounded shadow-sm">
                  <div className="text-sm font-bold text-orange-600">{questions.length - questionScores.filter(s => s > 0).length}</div>
                  <div className="text-xs text-muted-foreground">Left</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Language Metrics */}
          {bodyLanguageMetrics && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Body Language
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between items-center p-1 bg-blue-50 rounded text-xs">
                    <span>Eye Contact</span>
                    <span className="font-bold text-blue-600">{bodyLanguageMetrics.eyeContact}%</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-green-50 rounded text-xs">
                    <span>Confidence</span>
                    <span className="font-bold text-green-600">{bodyLanguageMetrics.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-purple-50 rounded text-xs">
                    <span>Engagement</span>
                    <span className="font-bold text-purple-600">{bodyLanguageMetrics.engagement}%</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Badge variant={
                    bodyLanguageMetrics.posture === 'good' ? 'default' :
                    bodyLanguageMetrics.posture === 'moving_too_much' ? 'destructive' :
                    'secondary'
                  } className="text-xs">
                    {bodyLanguageMetrics.posture.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center - Video and Chat */}
        <div className="col-span-7 space-y-4">
          {/* Video Section - Smaller */}
          <Card className="h-[40%]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Video Interview</CardTitle>
            </CardHeader>
            <CardContent className="h-full p-2">
              <div className="relative h-full bg-gray-900 rounded-lg overflow-hidden max-h-[300px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  onLoadedMetadata={() => {
                    console.log('📹 Video metadata loaded');
                    if (localVideoRef.current) {
                      console.log('📹 Video dimensions:', localVideoRef.current.videoWidth, 'x', localVideoRef.current.videoHeight);
                    }
                  }}
                  onCanPlay={() => {
                    console.log('📹 Video can play');
                  }}
                  onError={(e) => {
                    console.error('📹 Video error:', e);
                  }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center rounded-lg">
                    <CameraOff className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {isListening && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 animate-pulse">
                    <Mic className="w-3 h-3" />
                    LIVE
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3 animate-spin" />
                    AI
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Section - Larger */}
          <Card className="h-[55%]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Interview Chat
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAutoScrollEnabled(!isAutoScrollEnabled);
                    if (!isAutoScrollEnabled) {
                      setTimeout(() => forceScrollToBottom(), 100);
                    }
                  }}
                  className={`text-xs ${isAutoScrollEnabled ? 'text-green-600' : 'text-gray-500'}`}
                >
                  {isAutoScrollEnabled ? '📍 Auto' : '📍 Manual'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0 overflow-hidden">
              <div 
                className="h-full px-3 overflow-y-auto flex flex-col-reverse" 
                ref={chatScrollRef}
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-2 pb-2 pt-2 flex flex-col">
                  {[...conversation].reverse().map((message, index) => (
                    <div
                      key={`${message.timestamp.getTime()}-${index}`}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.isQuestion
                            ? 'bg-purple-100 border border-purple-200'
                            : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === 'ai' ? (
                            <Bot className="w-3 h-3 mt-1 flex-shrink-0" />
                          ) : (
                            <User className="w-3 h-3 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-xs font-medium mb-1">
                              {message.type === 'ai' ? 'AI' : 'You'}
                            </div>
                            <div className="text-xs leading-relaxed">
                              {message.content}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs opacity-70">
                                {formatTime(message.timestamp)}
                              </div>
                              {message.score !== undefined && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className={`text-xs font-medium ${
                                    message.score >= 80 ? 'text-green-600' :
                                    message.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {message.score}%
                                  </span>
                                </div>
                              )}
                            </div>
                            {message.analysis && (
                              <div className="mt-1 text-xs space-y-1">
                                {message.analysis.strengths.length > 0 && (
                                  <div className="text-green-600">
                                    ✓ {message.analysis.strengths[0]}
                                  </div>
                                )}
                                {message.analysis.improvements.length > 0 && (
                                  <div className="text-orange-600">
                                    💡 {message.analysis.improvements[0]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Status indicators */}
                  {(isAITalking || isProcessing) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <Bot className="w-3 h-3" />
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {isProcessing ? 'Analyzing...' : 'AI speaking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isPreparingToListen && (
                    <div className="flex justify-center">
                      <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-yellow-700">
                            Preparing to listen...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isListening && (
                    <div className="flex justify-end">
                      <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className="w-3 h-3 text-blue-600 animate-pulse" />
                          <span className="text-xs text-blue-600">
                            Listening... 
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={forceStopListening}
                            className="ml-2 h-5 px-2 text-xs"
                          >
                            Stop
                          </Button>
                        </div>
                        {liveTranscript && (
                          <div className="text-xs text-gray-700 italic border-t border-blue-200 pt-1 mt-1">
                            <span className="text-xs text-blue-600 block mb-1">Live:</span>
                            "{liveTranscript}"
                          </div>
                        )}
                        {currentTranscriptRef.current && (
                          <div className="text-xs text-gray-800 border-t border-blue-200 pt-1 mt-1">
                            <span className="text-xs text-blue-600 block mb-1">Response:</span>
                            "{currentTranscriptRef.current}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - AI Interviewer & Question Info */}
        <div className="col-span-3 space-y-4">
          {/* Control Buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Interview Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isAudioEnabled ? "default" : "destructive"}
                  onClick={toggleAudio}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isAudioEnabled ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  variant={isVideoEnabled ? "default" : "destructive"}
                  onClick={toggleVideo}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  {isVideoEnabled ? 'Video' : 'No Video'}
                </Button>
              </div>

              <Button
                variant={isSpeakerEnabled ? "default" : "destructive"}
                onClick={toggleSpeaker}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                {isSpeakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Speaker
              </Button>

              {/* Test Speech Button */}
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🧪 Testing speech synthesis...');
                  speakMessage('This is a test message. If you can hear this, speech synthesis is working correctly.');
                }}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Test Speech
              </Button>

              {/* Manual Start Button for Testing */}
              {!isConnected && (
                <Button
                  variant="default"
                  onClick={() => {
                    console.log('🚀 Manual start triggered');
                    initializeInterview();
                  }}
                  size="sm"
                  className="w-full flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Interview
                </Button>
              )}

              {isListening && (
                <Button
                  variant="outline"
                  onClick={forceStopListening}
                  size="sm"
                  className="w-full flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop Speaking
                </Button>
              )}

              <Button
                variant="destructive"
                onClick={() => {
                  console.log('🚨 END INTERVIEW CLICKED - EMERGENCY SESSION TERMINATION');
                  
                  // IMMEDIATELY stop all speech and voice agents
                  sessionManager.emergencyShutdown();
                  
                  // Force stop all local speech synthesis
                  if (typeof speechSynthesis !== 'undefined') {
                    speechSynthesis.cancel();
                    // Force multiple cancellations
                    for (let i = 0; i < 10; i++) {
                      setTimeout(() => speechSynthesis.cancel(), i * 100);
                    }
                  }
                  
                  // Set all states to stopped immediately
                  setIsAITalking(false);
                  setIsListening(false);
                  setIsProcessing(false);
                  setIsPreparingToListen(false);
                  setInterviewPhase('completed');
                  
                  // Terminate session completely
                  terminateSession();
                  
                  // End interview immediately
                  setTimeout(() => {
                    onInterviewEnd();
                  }, 100); // Very short delay to ensure termination completes
                }}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Interview
              </Button>

              {/* Emergency Stop Button */}
              {(isAITalking || isListening || isProcessing) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('🛑 EMERGENCY STOP ALL');
                    sessionManager.emergencyShutdown();
                    setIsListening(false);
                    setIsProcessing(false);
                    setIsPreparingToListen(false);
                    setIsAITalking(false);
                    toast.success('All processes stopped');
                  }}
                  size="sm"
                  className="w-full flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Pause className="w-4 h-4" />
                  Emergency Stop
                </Button>
              )}

              {/* Global Session Status */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div>Session: {sessionId.slice(-8)}</div>
                <div>Status: {sessionManager.getStatus().sessionCount} active</div>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 border-t">
                {isAITalking && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>AI is speaking...</span>
                  </div>
                )}
                {isListening && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span>Listening...</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                )}
                {!isAITalking && !isListening && !isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Ready</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Progress and Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Question Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Question {questionIndex + 1} of {questions.length}
                </span>
                <Badge variant={
                  interviewPhase === 'completed' ? 'default' :
                  interviewPhase === 'scored' ? 'secondary' :
                  interviewPhase === 'processing' ? 'outline' : 'destructive'
                }>
                  {interviewPhase === 'waiting' ? 'Starting' :
                   interviewPhase === 'asking' ? 'Asking' :
                   interviewPhase === 'listening' ? 'Listening' :
                   interviewPhase === 'processing' ? 'Processing' :
                   interviewPhase === 'scored' ? 'Scored' : 'Completed'}
                </Badge>
              </div>
              
              {/* Current Question Score */}
              {interviewPhase === 'scored' && currentQuestionScore > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Question Score</span>
                    <div className={`text-xl font-bold ${
                      currentQuestionScore >= 80 ? 'text-green-600' :
                      currentQuestionScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {currentQuestionScore}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        currentQuestionScore >= 80 ? 'bg-green-500' :
                        currentQuestionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${currentQuestionScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Processing Indicator */}
              {isProcessingAnswer && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Brain className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Scoring your answer...</span>
                  </div>
                </div>
              )}
              
              {/* Next Question Button */}
              {showNextQuestionButton && (
                <Button
                  onClick={moveToNextQuestion}
                  className="w-full flex items-center gap-2"
                  size="sm"
                >
                  {questionIndex + 1 >= questions.length ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Interview
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Next Question ({questionIndex + 2}/{questions.length})
                    </>
                  )}
                </Button>
              )}
              
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{Math.round(((questionIndex + (interviewPhase === 'scored' ? 1 : 0)) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((questionIndex + (interviewPhase === 'scored' ? 1 : 0)) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Interviewer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Interviewer</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleInterviewerDisplay
                isActive={isConnected}
                isSpeaking={isAITalking}
                isListening={isListening}
                personality={{
                  name: "Alex Thompson",
                  role: selectedRole,
                  difficulty: difficulty
                }}
              />
            </CardContent>
          </Card>

          {/* Current Question Info */}
          {currentQuestion && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Question {questionIndex + 1} of {questions.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant={currentQuestion.category === 'hr' ? 'secondary' : 'default'} className="text-xs">
                    {currentQuestion.category === 'hr' ? 'HR' : 'Technical'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{currentQuestion.difficulty}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentQuestion.question}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Interview Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Questions</span>
                <span>{questionIndex + 1} / {questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {Math.round(((questionIndex + 1) / questions.length) * 100)}% Complete
              </div>
              
              {/* Overall Score */}
              {answeredQuestions > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(totalScore / answeredQuestions)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Overall Score</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIVideoInterview;