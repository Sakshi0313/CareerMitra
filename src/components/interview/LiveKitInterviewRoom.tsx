import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AIInterviewerAvatar from './AIInterviewerAvatar';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Volume2,
  VolumeX,
  Settings,
  Brain,
  MessageSquare,
  Clock,
  AlertTriangle,
  Activity
} from "lucide-react";
import { liveKitService } from '@/lib/liveKitService';

interface LiveKitInterviewRoomProps {
  roomName: string;
  token: string;
  onInterviewStart: () => void;
  onInterviewEnd: () => void;
  onAIResponse: (response: string) => void;
  selectedRole: string;
  difficulty: string;
  bodyLanguageMetrics?: any;
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  error?: string;
}

const LiveKitInterviewRoom: React.FC<LiveKitInterviewRoomProps> = ({
  roomName,
  token,
  onInterviewStart,
  onInterviewEnd,
  onAIResponse,
  selectedRole,
  difficulty,
  bodyLanguageMetrics
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'disconnected' });
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [aiAudioStream, setAiAudioStream] = useState<MediaStream | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>>([]);
  
  const roomRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize LiveKit connection and AI personality
  useEffect(() => {
    const initializeLiveKit = async () => {
      if (!roomName || !token) return;

      try {
        setConnectionState({ status: 'connecting' });

        // Set AI interviewer personality
        liveKitService.setInterviewerPersonality(selectedRole, difficulty);
        
        // Connect to LiveKit room
        await liveKitService.connectToRoom(roomName, token);
        
        setConnectionState({ status: 'connected' });
        startInterview();
      } catch (error) {
        console.error('Failed to connect to LiveKit:', error);
        setConnectionState({ 
          status: 'failed', 
          error: 'Failed to connect to interview room. Please try again.' 
        });
      }
    };

    initializeLiveKit();

    return () => {
      disconnect();
    };
  }, [roomName, token, selectedRole, difficulty]);

  const startInterview = async () => {
    onInterviewStart();
    
    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setInterviewDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // AI Introduction with personality
    const personality = liveKitService.getCurrentPersonality();
    const introduction = `Hello! I'm ${personality?.name || 'your AI interviewer'}. I'll be conducting your ${selectedRole} interview at ${difficulty} level today. I can see and hear you, and I'll adapt my questions based on how you're doing. Let's begin!`;
    
    await speakAIResponse(introduction);
    
    // First question after introduction
    setTimeout(() => {
      askFirstQuestion();
    }, 3000);
  };

  const askFirstQuestion = async () => {
    const firstQuestions = {
      frontend: {
        easy: "Let's start with something comfortable. Can you tell me about yourself and what got you interested in frontend development?",
        medium: "I'd like to begin by understanding your experience. Can you walk me through a challenging frontend project you've worked on recently?",
        hard: "Let's dive right in. How would you approach building a large-scale, performant frontend application that needs to handle millions of users?"
      },
      backend: {
        easy: "Great to meet you! Let's start with the basics. What is an API and why is it important in backend development?",
        medium: "I'm curious about your experience. Can you explain the difference between SQL and NoSQL databases and when you'd use each?",
        hard: "Let's begin with a complex scenario. How would you design a backend system that needs to handle 100,000 concurrent users?"
      },
      fullstack: {
        easy: "Nice to meet you! Let's start broad. What's the difference between frontend and backend development, and how do they work together?",
        medium: "I'd like to understand your approach. How do you handle data flow between frontend and backend in a modern web application?",
        hard: "Let's tackle a comprehensive challenge. Design a complete fullstack architecture for a real-time collaborative application like Google Docs."
      }
    };

    const question = firstQuestions[selectedRole as keyof typeof firstQuestions]?.[difficulty as keyof typeof firstQuestions.frontend] || 
                    "Tell me about your experience with software development.";
    
    setCurrentQuestion(question);
    await speakAIResponse(question);
    
    // Start listening for user response
    startListening();
  };

  const speakAIResponse = async (text: string) => {
    try {
      setIsAITalking(true);
      
      // Generate adaptive response based on body language if available
      const adaptiveText = bodyLanguageMetrics ? 
        liveKitService.generateAdaptiveResponse(text, bodyLanguageMetrics) : text;
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        type: 'ai',
        content: adaptiveText,
        timestamp: new Date()
      }]);
      
      // Synthesize speech using Murf AI
      const audioBuffer = await liveKitService.synthesizeSpeech(adaptiveText);
      
      // Play audio
      if (remoteAudioRef.current && audioBuffer.byteLength > 0) {
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        remoteAudioRef.current.src = audioUrl;
        await remoteAudioRef.current.play();
        
        // Create audio stream for lip sync
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(remoteAudioRef.current);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        setAiAudioStream(destination.stream);
      }
      
      onAIResponse(adaptiveText);
    } catch (error) {
      console.error('Error speaking AI response:', error);
    } finally {
      setIsAITalking(false);
    }
  };

  const startListening = async () => {
    try {
      setIsUserSpeaking(true);
      recordingRef.current = await liveKitService.startRecording();
      
      // Auto-stop listening after 60 seconds
      setTimeout(() => {
        if (isUserSpeaking) {
          stopListening();
        }
      }, 60000);
    } catch (error) {
      console.error('Error starting to listen:', error);
      setIsUserSpeaking(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsUserSpeaking(false);
      
      if (recordingRef.current) {
        const audioBlob = await liveKitService.stopRecording();
        
        // Transcribe audio using Deepgram
        const transcript = await liveKitService.transcribeAudio(audioBlob);
        
        if (transcript.trim()) {
          // Add user response to conversation history
          setConversationHistory(prev => [...prev, {
            type: 'user',
            content: transcript,
            timestamp: new Date()
          }]);
          
          // Process user response and generate AI feedback
          await processUserResponse(transcript);
        } else {
          // No speech detected, ask again
          await speakAIResponse("I didn't catch that. Could you please repeat your answer?");
          setTimeout(() => startListening(), 2000);
        }
      }
    } catch (error) {
      console.error('Error stopping listening:', error);
    }
  };

  const processUserResponse = async (transcript: string) => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate AI feedback based on response and body language
    let feedback = "Thank you for that response. ";
    
    if (bodyLanguageMetrics) {
      if (bodyLanguageMetrics.confidence > 80) {
        feedback += "I can see you're confident about this topic. ";
      } else if (bodyLanguageMetrics.nervousness > 60) {
        feedback += "I notice you might be a bit nervous - that's completely normal. ";
      }
      
      if (bodyLanguageMetrics.eyeContact < 50) {
        feedback += "Try to maintain eye contact with the camera. ";
      }
    }
    
    // Add some basic content analysis
    if (transcript.length > 200) {
      feedback += "Great detail in your answer! ";
    } else if (transcript.length < 50) {
      feedback += "Could you elaborate a bit more on that? ";
    }
    
    feedback += "Let me ask you a follow-up question.";
    
    await speakAIResponse(feedback);
    
    // Ask next question after feedback
    setTimeout(() => {
      askNextQuestion();
    }, 3000);
  };

  const askNextQuestion = async () => {
    const followUpQuestions = [
      "Can you give me a specific example of how you've implemented this in a real project?",
      "What challenges did you face when working with this technology?",
      "How do you stay updated with the latest developments in this area?",
      "What would you do differently if you had to solve this problem again?",
      "How would you explain this concept to a junior developer?"
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    setCurrentQuestion(randomQuestion);
    
    await speakAIResponse(randomQuestion);
    setTimeout(() => startListening(), 2000);
  };

  const disconnect = async () => {
    await liveKitService.disconnect();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setConnectionState({ status: 'disconnected' });
    onInterviewEnd();
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // In real implementation, toggle local audio track
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // In real implementation, toggle local video track
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerEnabled;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Video Interview
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={
                connectionState.status === 'connected' ? 'default' :
                connectionState.status === 'connecting' ? 'secondary' :
                connectionState.status === 'failed' ? 'destructive' : 'outline'
              }>
                {connectionState.status}
              </Badge>
              {connectionState.status === 'connected' && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(interviewDuration)}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionState.status === 'connecting' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Connecting to AI interviewer...</p>
            </div>
          )}

          {connectionState.status === 'failed' && connectionState.error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{connectionState.error}</AlertDescription>
            </Alert>
          )}

          {connectionState.status === 'connected' && (
            <div className="space-y-4">
              {/* Video Area */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Local Video */}
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    You
                  </div>
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
                      <CameraOff className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {isUserSpeaking && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      Speaking...
                    </div>
                  )}
                </div>

                {/* AI Interviewer Avatar */}
                <div className="relative">
                  <AIInterviewerAvatar
                    isActive={connectionState.status === 'connected'}
                    isSpeaking={isAITalking}
                    isListening={isUserSpeaking}
                    audioStream={aiAudioStream || undefined}
                    personality={{
                      name: liveKitService.getCurrentPersonality()?.name || 'AI Interviewer',
                      role: selectedRole,
                      difficulty: difficulty
                    }}
                    bodyLanguageMetrics={bodyLanguageMetrics ? {
                      eyeContact: bodyLanguageMetrics.eyeContact,
                      facialExpression: bodyLanguageMetrics.facialExpression,
                      confidence: bodyLanguageMetrics.confidence,
                      engagement: bodyLanguageMetrics.engagement
                    } : undefined}
                  />
                </div>
              </div>

              {/* Current Question Display */}
              {currentQuestion && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium mb-1">Current Question:</div>
                      <p className="text-sm text-muted-foreground">{currentQuestion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Status */}
              <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
                {isAITalking && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">AI is speaking...</span>
                  </div>
                )}
                {isUserSpeaking && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Listening to your response...</span>
                  </div>
                )}
                {!isAITalking && !isUserSpeaking && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Ready for interaction</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleAudio}
                  className="rounded-full w-12 h-12"
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isVideoEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12"
                >
                  {isVideoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isSpeakerEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleSpeaker}
                  className="rounded-full w-12 h-12"
                >
                  {isSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>

                {isUserSpeaking && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={stopListening}
                    className="rounded-full w-12 h-12"
                  >
                    <Activity className="w-5 h-5" />
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={disconnect}
                  className="rounded-full w-12 h-12"
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>

              {/* Interview Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Role: {selectedRole} • Level: {difficulty} • Duration: {formatDuration(interviewDuration)}</p>
                <p className="mt-1">AI Interviewer: {liveKitService.getCurrentPersonality()?.name} • Voice-enabled with real-time analysis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden audio element for AI responses */}
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default LiveKitInterviewRoom;