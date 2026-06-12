import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, 
  Activity,
  Mic,
  Brain
} from "lucide-react";

interface SimpleInterviewerDisplayProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  personality: {
    name: string;
    role: string;
    difficulty: string;
  };
}

const SimpleInterviewerDisplay: React.FC<SimpleInterviewerDisplayProps> = ({
  isActive,
  isSpeaking,
  isListening,
  personality
}) => {
  return (
    <div className="relative">
      {/* Simple Black Box with "Interviewer" Text */}
      <div className={`w-full h-64 bg-black rounded-xl shadow-2xl border-2 border-white/50 flex items-center justify-center relative ${
        isSpeaking ? 'ring-4 ring-green-500 ring-opacity-50' : 
        isListening ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
      }`}>
        <div className="text-center">
          <div className="text-white text-3xl font-bold mb-2">
            INTERVIEWER
          </div>
          <div className="text-gray-300 text-lg">
            {personality.name}
          </div>
        </div>
        
        {/* Speaking Animation */}
        {isSpeaking && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-xl animate-pulse" />
        )}
        
        {/* Listening Animation */}
        {isListening && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl animate-pulse" />
        )}
      </div>
      
      {/* Status Indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {isSpeaking && (
          <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse shadow-lg">
            <Volume2 className="w-3 h-3 mr-1" />
            Speaking
          </Badge>
        )}
        {isListening && (
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg">
            <Mic className="w-3 h-3 mr-1" />
            Listening
          </Badge>
        )}
      </div>
      
      {/* AI Status */}
      {isActive && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500/90 to-indigo-600/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
          <Brain className="w-3 h-3" />
          AI Active
        </div>
      )}
      
      {/* Interview Info */}
      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-black/80 to-gray-800/80 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
        {personality.role} • {personality.difficulty}
      </div>
    </div>
  );
};

export default SimpleInterviewerDisplay;