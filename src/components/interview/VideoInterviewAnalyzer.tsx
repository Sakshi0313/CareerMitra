import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Eye, 
  Smile, 
  AlertTriangle,
  TrendingUp,
  Volume2,
  Settings,
  Activity
} from "lucide-react";

interface BodyLanguageMetrics {
  eyeContact: number;
  facialExpression: 'neutral' | 'positive' | 'negative' | 'confused';
  handGestures: number;
  posture: 'good' | 'slouching' | 'leaning';
  confidence: number;
  engagement: number;
  nervousness: number;
}

interface VideoAnalysisProps {
  isActive: boolean;
  onMetricsUpdate: (metrics: BodyLanguageMetrics) => void;
  onVideoReady: (stream: MediaStream) => void;
}

const VideoInterviewAnalyzer: React.FC<VideoAnalysisProps> = ({
  isActive,
  onMetricsUpdate,
  onVideoReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [metrics, setMetrics] = useState<BodyLanguageMetrics>({
    eyeContact: 0,
    facialExpression: 'neutral',
    handGestures: 0,
    posture: 'good',
    confidence: 0,
    engagement: 0,
    nervousness: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const eyeContactFrames = useRef(0);
  const totalFrames = useRef(0);
  const handGestureCount = useRef(0);

  // Start video stream
  useEffect(() => {
    const startVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          },
          audio: true
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        onVideoReady(mediaStream);
        setError(null);
      } catch (err) {
        console.error('Failed to access camera:', err);
        setError('Failed to access camera. Please check permissions.');
      }
    };

    if (isActive && isVideoEnabled) {
      startVideo();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, isVideoEnabled, onVideoReady]);

  // Simplified analysis loop (without MediaPipe for now)
  useEffect(() => {
    let animationFrame: number;
    let analysisInterval: NodeJS.Timeout;

    const simulateAnalysis = () => {
      if (!isAnalyzing) return;

      // Simulate realistic metrics
      const newMetrics: BodyLanguageMetrics = {
        eyeContact: Math.floor(Math.random() * 40) + 60, // 60-100%
        facialExpression: ['neutral', 'positive', 'neutral', 'positive'][Math.floor(Math.random() * 4)] as any,
        handGestures: Math.floor(Math.random() * 5) + 2, // 2-7 gestures
        posture: ['good', 'good', 'leaning'][Math.floor(Math.random() * 3)] as any,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        engagement: Math.floor(Math.random() * 25) + 75, // 75-100%
        nervousness: Math.floor(Math.random() * 30) + 10 // 10-40%
      };

      setMetrics(newMetrics);
      onMetricsUpdate(newMetrics);
    };

    if (isActive && isAnalyzing) {
      analysisInterval = setInterval(simulateAnalysis, 2000); // Update every 2 seconds
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isActive, isAnalyzing, onMetricsUpdate]);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    eyeContactFrames.current = 0;
    totalFrames.current = 0;
    handGestureCount.current = 0;
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4">
      {/* Video Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Video Interview Analysis
            </span>
            <div className="flex gap-2">
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Analysis Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
              {!isAnalyzing ? (
                <Button onClick={startAnalysis} size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              ) : (
                <Button onClick={stopAnalysis} variant="destructive" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Stop Analysis
                </Button>
              )}
            </div>

            {/* Live Metrics Overlay */}
            {isAnalyzing && (
              <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-lg text-xs">
                <div>Eye Contact: {metrics.eyeContact}%</div>
                <div>Confidence: {metrics.confidence}%</div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    metrics.facialExpression === 'positive' ? 'bg-green-500' :
                    metrics.facialExpression === 'negative' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  {metrics.facialExpression}
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Body Language Metrics */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Real-time Body Language Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Eye Contact
                  </span>
                  <span className="text-sm font-medium">{metrics.eyeContact}%</span>
                </div>
                <Progress value={metrics.eyeContact} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Confidence</span>
                  <span className="text-sm font-medium">{metrics.confidence}%</span>
                </div>
                <Progress value={metrics.confidence} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Engagement</span>
                  <span className="text-sm font-medium">{metrics.engagement}%</span>
                </div>
                <Progress value={metrics.engagement} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Nervousness</span>
                  <span className="text-sm font-medium">{metrics.nervousness}%</span>
                </div>
                <Progress value={metrics.nervousness} className="[&>div]:bg-red-500" />
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4" />
                <span>Expression:</span>
                <Badge variant={
                  metrics.facialExpression === 'positive' ? 'default' :
                  metrics.facialExpression === 'negative' ? 'destructive' :
                  'secondary'
                }>
                  {metrics.facialExpression}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span>Posture:</span>
                <Badge variant={metrics.posture === 'good' ? 'default' : 'secondary'}>
                  {metrics.posture}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span>Hand Gestures:</span>
                <Badge variant="outline">{metrics.handGestures}</Badge>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> This is a demo version with simulated metrics. 
                Full MediaPipe integration will provide real computer vision analysis.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoInterviewAnalyzer;