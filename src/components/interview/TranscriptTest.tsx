import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeepgramService, { type TranscriptResult } from '@/lib/deepgramService';
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";

const TranscriptTest: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const deepgramServiceRef = useRef<DeepgramService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initializeDeepgram = async () => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      toast.error('Deepgram API key not found');
      return false;
    }

    try {
      deepgramServiceRef.current = new DeepgramService({
        apiKey,
        model: 'nova-2',
        language: 'en',
        smartFormat: true,
        interimResults: true,
        endpointing: 500
      });

      deepgramServiceRef.current.onOpen(() => {
        setIsConnected(true);
        toast.success('Connected to Deepgram!');
      });

      deepgramServiceRef.current.onTranscript((result: TranscriptResult) => {
        console.log('Transcript result:', result);
        
        if (result.isFinal) {
          setFinalTranscript(prev => prev + ' ' + result.transcript);
          setLiveTranscript('');
        } else {
          setLiveTranscript(result.transcript);
        }
      });

      deepgramServiceRef.current.onError((error) => {
        console.error('Deepgram error:', error);
        toast.error('Deepgram error: ' + error.message);
      });

      const connected = await deepgramServiceRef.current.connect();
      return connected;
    } catch (error) {
      console.error('Failed to initialize Deepgram:', error);
      toast.error('Failed to initialize Deepgram');
      return false;
    }
  };

  const startListening = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      streamRef.current = stream;

      // Initialize Deepgram if not already done
      if (!deepgramServiceRef.current || !isConnected) {
        const initialized = await initializeDeepgram();
        if (!initialized) return;
      }

      // Start listening
      const started = await deepgramServiceRef.current!.startListening(stream);
      
      if (started) {
        setIsListening(true);
        setLiveTranscript('');
        setFinalTranscript('');
        toast.success('Started listening!');
      } else {
        toast.error('Failed to start listening');
      }
    } catch (error) {
      console.error('Error starting listening:', error);
      toast.error('Error accessing microphone');
    }
  };

  const stopListening = () => {
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.stopListening();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setLiveTranscript('');
    toast.success('Stopped listening');
  };

  const clearTranscripts = () => {
    setLiveTranscript('');
    setFinalTranscript('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Deepgram Transcript Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
          
          <Button onClick={clearTranscripts} variant="outline">
            Clear
          </Button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Live Transcript (Interim):
            </div>
            <div className="text-sm text-blue-700 italic min-h-[20px]">
              {liveTranscript || (isListening ? 'Listening...' : 'Not listening')}
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">
              Final Transcript:
            </div>
            <div className="text-sm text-green-700 min-h-[40px]">
              {finalTranscript || 'No final transcript yet'}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Connection Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptTest;