import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  Smile,
  Brain,
  Activity
} from "lucide-react";

interface AIInterviewerAvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  audioStream?: MediaStream;
  personality: {
    name: string;
    role: string;
    difficulty: string;
  };
  bodyLanguageMetrics?: {
    eyeContact: number;
    facialExpression: string;
    confidence: number;
    engagement: number;
  };
}

const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  isActive,
  isSpeaking,
  isListening,
  audioStream,
  personality,
  bodyLanguageMetrics
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  
  const [lipSyncIntensity, setLipSyncIntensity] = useState(0);
  const [eyeBlinkTimer, setEyeBlinkTimer] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [facialExpression, setFacialExpression] = useState('neutral');

  // Avatar configuration based on personality
  const getAvatarConfig = () => {
    const configs = {
      frontend: {
        easy: { 
          color: '#3B82F6', 
          style: 'friendly',
          eyeColor: '#2563EB',
          hairColor: '#8B5CF6'
        },
        medium: { 
          color: '#059669', 
          style: 'professional',
          eyeColor: '#047857',
          hairColor: '#374151'
        },
        hard: { 
          color: '#DC2626', 
          style: 'authoritative',
          eyeColor: '#B91C1C',
          hairColor: '#1F2937'
        }
      },
      backend: {
        easy: { 
          color: '#7C3AED', 
          style: 'supportive',
          eyeColor: '#6D28D9',
          hairColor: '#92400E'
        },
        medium: { 
          color: '#EA580C', 
          style: 'analytical',
          eyeColor: '#C2410C',
          hairColor: '#451A03'
        },
        hard: { 
          color: '#BE123C', 
          style: 'challenging',
          eyeColor: '#9F1239',
          hairColor: '#0F172A'
        }
      }
    };

    return configs[personality.role as keyof typeof configs]?.[personality.difficulty as keyof typeof configs.frontend] || 
           configs.frontend.easy;
  };

  // Initialize audio analysis for lip sync
  useEffect(() => {
    if (audioStream && isActive) {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        
        const source = audioContextRef.current.createMediaStreamSource(audioStream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 256;
        startLipSyncAnalysis();
      } catch (error) {
        console.error('Error setting up audio analysis:', error);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioStream, isActive]);

  // Lip sync analysis
  const startLipSyncAnalysis = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume for lip sync
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const intensity = Math.min(average / 128, 1); // Normalize to 0-1
      
      setLipSyncIntensity(intensity);
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  // Eye blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlinkTimer(prev => {
        if (prev > 0) return prev - 1;
        // Random blink every 2-5 seconds
        return Math.random() > 0.7 ? 3 : 0;
      });
    }, 100);

    return () => clearInterval(blinkInterval);
  }, []);

  // Head movement based on body language analysis
  useEffect(() => {
    if (bodyLanguageMetrics) {
      // Subtle head movements based on user's engagement
      const tilt = (bodyLanguageMetrics.engagement - 50) / 100; // -0.5 to 0.5
      setHeadTilt(tilt * 5); // Convert to degrees
      
      // Facial expression based on user's confidence
      if (bodyLanguageMetrics.confidence > 80) {
        setFacialExpression('encouraging');
      } else if (bodyLanguageMetrics.confidence < 40) {
        setFacialExpression('supportive');
      } else {
        setFacialExpression('neutral');
      }
    }
  }, [bodyLanguageMetrics]);

  // Draw avatar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = getAvatarConfig();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Apply head tilt
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((headTilt * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    // Draw face background
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 80, 100, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw face outline
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw eyes
    const eyeY = centerY - 20;
    const eyeSize = eyeBlinkTimer > 0 ? 2 : 12;
    
    // Left eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX - 25, eyeY, 15, eyeSize, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.stroke();
    
    // Right eye
    ctx.beginPath();
    ctx.ellipse(centerX + 25, eyeY, 15, eyeSize, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw pupils (following user's eye contact)
    if (eyeBlinkTimer === 0) {
      const pupilOffset = bodyLanguageMetrics?.eyeContact > 60 ? 0 : 3;
      ctx.fillStyle = config.eyeColor;
      ctx.beginPath();
      ctx.ellipse(centerX - 25 + pupilOffset, eyeY, 6, 6, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(centerX + 25 + pupilOffset, eyeY, 6, 6, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw eyebrows (expression-based)
    ctx.strokeStyle = config.hairColor;
    ctx.lineWidth = 3;
    const browOffset = facialExpression === 'encouraging' ? -2 : 
                     facialExpression === 'supportive' ? 1 : 0;
    
    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(centerX - 40, eyeY - 20 + browOffset);
    ctx.lineTo(centerX - 10, eyeY - 25 + browOffset);
    ctx.stroke();
    
    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(centerX + 10, eyeY - 25 + browOffset);
    ctx.lineTo(centerX + 40, eyeY - 20 + browOffset);
    ctx.stroke();
    
    // Draw nose
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 5);
    ctx.lineTo(centerX - 3, centerY + 5);
    ctx.moveTo(centerX, centerY + 5);
    ctx.lineTo(centerX + 3, centerY + 5);
    ctx.stroke();
    
    // Draw mouth with lip sync
    const mouthY = centerY + 25;
    const mouthWidth = 20 + (lipSyncIntensity * 15);
    const mouthHeight = 3 + (lipSyncIntensity * 8);
    
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    
    if (isSpeaking && lipSyncIntensity > 0.1) {
      // Open mouth for speaking
      ctx.ellipse(centerX, mouthY, mouthWidth, mouthHeight, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Teeth
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(centerX, mouthY - 2, mouthWidth - 3, 2, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Closed mouth with expression
      const smileOffset = facialExpression === 'encouraging' ? -5 : 
                         facialExpression === 'supportive' ? -2 : 0;
      
      ctx.beginPath();
      ctx.moveTo(centerX - mouthWidth, mouthY + smileOffset);
      ctx.quadraticCurveTo(centerX, mouthY + 5 + smileOffset, centerX + mouthWidth, mouthY + smileOffset);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();
    }
    
    // Draw hair
    ctx.fillStyle = config.hairColor;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 60, 85, 40, 0, 0, Math.PI, true);
    ctx.fill();
    
    ctx.restore();
  }, [lipSyncIntensity, eyeBlinkTimer, headTilt, facialExpression, isSpeaking, bodyLanguageMetrics, personality]);

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="relative">
          {/* Avatar Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg bg-gradient-to-br from-blue-50 to-purple-50"
            style={{ maxWidth: '300px', height: '300px' }}
          />
          
          {/* Status Indicators */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isSpeaking && (
              <Badge variant="default" className="text-xs bg-green-500">
                <Volume2 className="w-3 h-3 mr-1" />
                Speaking
              </Badge>
            )}
            {isListening && (
              <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                <Activity className="w-3 h-3 mr-1" />
                Listening
              </Badge>
            )}
          </div>
          
          {/* Personality Info */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {personality.name}
          </div>
          
          {/* Body Language Awareness Indicator */}
          {bodyLanguageMetrics && (
            <div className="absolute top-2 left-2 bg-purple-500/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Analyzing
            </div>
          )}
          
          {/* Lip Sync Intensity Indicator (for debugging) */}
          {isSpeaking && (
            <div className="absolute bottom-2 right-2 bg-red-500/80 text-white px-2 py-1 rounded text-xs">
              Sync: {Math.round(lipSyncIntensity * 100)}%
            </div>
          )}
        </div>
        
        {/* Avatar Info */}
        <div className="mt-3 text-center">
          <div className="font-medium text-sm">{personality.name}</div>
          <div className="text-xs text-muted-foreground">
            {personality.role} • {personality.difficulty} Level
          </div>
          
          {/* Real-time Reactions */}
          {bodyLanguageMetrics && (
            <div className="mt-2 flex justify-center gap-2">
              {bodyLanguageMetrics.eyeContact > 70 && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Good eye contact
                </Badge>
              )}
              {bodyLanguageMetrics.confidence > 80 && (
                <Badge variant="outline" className="text-xs">
                  <Smile className="w-3 h-3 mr-1" />
                  Confident
                </Badge>
              )}
              {bodyLanguageMetrics.engagement > 75 && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  Engaged
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInterviewerAvatar;