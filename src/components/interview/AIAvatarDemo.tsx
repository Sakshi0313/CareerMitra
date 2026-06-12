import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AIInterviewerAvatar from './AIInterviewerAvatar';
import { Play, Square, Volume2, Eye, Smile, Activity } from "lucide-react";

const AIAvatarDemo: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState({
    name: 'Sarah',
    role: 'frontend',
    difficulty: 'easy'
  });
  const [mockBodyLanguage, setMockBodyLanguage] = useState({
    eyeContact: 75,
    facialExpression: 'neutral',
    confidence: 80,
    engagement: 85
  });

  // Demo speech simulation
  const simulateSpeech = () => {
    setIsSpeaking(true);
    setTimeout(() => {
      setIsSpeaking(false);
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
      }, 3000);
    }, 4000);
  };

  // Auto-update mock body language for demo
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setMockBodyLanguage(prev => ({
        eyeContact: Math.max(30, Math.min(95, prev.eyeContact + (Math.random() - 0.5) * 20)),
        facialExpression: ['neutral', 'positive', 'neutral'][Math.floor(Math.random() * 3)] as any,
        confidence: Math.max(40, Math.min(95, prev.confidence + (Math.random() - 0.5) * 15)),
        engagement: Math.max(50, Math.min(95, prev.engagement + (Math.random() - 0.5) * 10))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const personalities = [
    { name: 'Sarah', role: 'frontend', difficulty: 'easy' },
    { name: 'Alex', role: 'frontend', difficulty: 'medium' },
    { name: 'Dr. Chen', role: 'frontend', difficulty: 'hard' },
    { name: 'Mike', role: 'backend', difficulty: 'easy' },
    { name: 'Jessica', role: 'backend', difficulty: 'medium' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI Interviewer Avatar Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Avatar Display */}
            <div>
              <AIInterviewerAvatar
                isActive={isActive}
                isSpeaking={isSpeaking}
                isListening={isListening}
                personality={currentPersonality}
                bodyLanguageMetrics={isActive ? mockBodyLanguage : undefined}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Demo Controls</h4>
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => setIsActive(!isActive)}
                    variant={isActive ? "destructive" : "default"}
                  >
                    {isActive ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isActive ? 'Stop Demo' : 'Start Demo'}
                  </Button>
                  
                  {isActive && (
                    <Button onClick={simulateSpeech} disabled={isSpeaking || isListening}>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Simulate Speech
                    </Button>
                  )}
                </div>
              </div>

              {/* Personality Selector */}
              <div>
                <h4 className="font-medium mb-2">AI Personality</h4>
                <div className="grid grid-cols-1 gap-2">
                  {personalities.map((personality, index) => (
                    <Button
                      key={index}
                      variant={currentPersonality.name === personality.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPersonality(personality)}
                      className="justify-start"
                    >
                      {personality.name} - {personality.role} ({personality.difficulty})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mock Body Language Metrics */}
              {isActive && (
                <div>
                  <h4 className="font-medium mb-2">Live Body Language Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Eye Contact
                      </span>
                      <Badge variant="outline">{mockBodyLanguage.eyeContact}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confidence</span>
                      <Badge variant="outline">{mockBodyLanguage.confidence}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Engagement</span>
                      <Badge variant="outline">{mockBodyLanguage.engagement}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Smile className="w-3 h-3" />
                        Expression
                      </span>
                      <Badge variant={mockBodyLanguage.facialExpression === 'positive' ? 'default' : 'secondary'}>
                        {mockBodyLanguage.facialExpression}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div>
                <h4 className="font-medium mb-2">Avatar Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Real-time lip sync with audio</li>
                  <li>✅ Eye blinking animation</li>
                  <li>✅ Body language awareness</li>
                  <li>✅ Adaptive facial expressions</li>
                  <li>✅ Head movement based on engagement</li>
                  <li>✅ Personality-based appearance</li>
                  <li>✅ Speaking/listening states</li>
                  <li>✅ Free & lightweight (Canvas-based)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAvatarDemo;