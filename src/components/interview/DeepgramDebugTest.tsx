import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DeepgramService, { type TranscriptResult } from '@/lib/deepgramService';
import { Mic, MicOff, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const DeepgramDebugTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const deepgramServiceRef = useRef<DeepgramService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    console.log(`[DeepgramDebug] ${message}`);
  };

  const testApiKey = async () => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      addLog('❌ No API key found in environment variables');
      setApiKeyValid(false);
      return;
    }

    addLog('🔑 Testing API key...');
    try {
      const isValid = await DeepgramService.testApiKey(apiKey);
      setApiKeyValid(isValid);
      if (isValid) {
        addLog('✅ API key is valid');
        toast.success('API key is valid!');
      } else {
        addLog('❌ API key is invalid or connection failed');
        toast.error('API key is invalid');
      }
    } catch (error: any) {
      addLog(`❌ API key test failed: ${error.message}`);
      setApiKeyValid(false);
      toast.error('API key test failed');
    }
  };

  const testAudioPermission = async () => {
    addLog('🎤 Testing audio permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        addLog(`✅ Audio permission granted - ${audioTracks.length} track(s)`);
        addLog(`📊 Audio track: ${audioTracks[0].label || 'Unknown'}`);
        addLog(`🔧 Settings: ${JSON.stringify(audioTracks[0].getSettings())}`);
        setAudioPermission(true);
        toast.success('Audio permission granted!');
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      } else {
        addLog('❌ No audio tracks available');
        setAudioPermission(false);
        toast.error('No audio tracks available');
      }
    } catch (error: any) {
      addLog(`❌ Audio permission denied: ${error.message}`);
      setAudioPermission(false);
      toast.error('Audio permission denied');
    }
  };

  const connectToDeepgram = async () => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      addLog('❌ No API key available');
      return;
    }

    setConnectionStatus('connecting');
    addLog('🔌 Connecting to Deepgram...');

    try {
      deepgramServiceRef.current = new DeepgramService({
        apiKey,
        model: 'nova-2',
        language: 'en',
        smartFormat: true,
        interimResults: true,
        endpointing: 300
      });

      // Set up event listeners
      deepgramServiceRef.current.onOpen(() => {
        addLog('✅ Deepgram connection opened');
        setIsConnected(true);
        setConnectionStatus('connected');
        toast.success('Connected to Deepgram!');
      });

      deepgramServiceRef.current.onTranscript((result: TranscriptResult) => {
        addLog(`📝 Transcript: "${result.transcript}" (final: ${result.isFinal})`);
        
        if (result.isFinal) {
          setTranscript(prev => prev + ' ' + result.transcript);
          setLiveTranscript('');
        } else {
          setLiveTranscript(result.transcript);
        }
      });

      deepgramServiceRef.current.onError((error: any) => {
        addLog(`❌ Deepgram error: ${error.message}`);
        setConnectionStatus('error');
        toast.error('Deepgram error: ' + error.message);
      });

      deepgramServiceRef.current.onClose(() => {
        addLog('🔌 Deepgram connection closed');
        setIsConnected(false);
        setConnectionStatus('idle');
      });

      // Connect
      const connected = await deepgramServiceRef.current.connect();
      
      if (!connected) {
        throw new Error('Failed to connect');
      }

    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
      setConnectionStatus('error');
      toast.error('Connection failed: ' + error.message);
    }
  };

  const startListening = async () => {
    if (!deepgramServiceRef.current || !isConnected) {
      addLog('❌ Not connected to Deepgram');
      return;
    }

    addLog('🎤 Starting to listen...');
    
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      addLog('✅ Audio stream obtained');

      // Start listening
      await deepgramServiceRef.current.startListening(stream);
      setIsListening(true);
      addLog('✅ Listening started');
      toast.success('Listening started!');

    } catch (error: any) {
      addLog(`❌ Failed to start listening: ${error.message}`);
      toast.error('Failed to start listening: ' + error.message);
    }
  };

  const stopListening = () => {
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.stopListening();
      addLog('🛑 Stopped listening');
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      addLog('🛑 Audio stream stopped');
    }
    
    setIsListening(false);
    toast.info('Listening stopped');
  };

  const disconnect = () => {
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.disconnect();
      deepgramServiceRef.current = null;
    }
    
    stopListening();
    setIsConnected(false);
    setConnectionStatus('idle');
    addLog('🔌 Disconnected from Deepgram');
    toast.info('Disconnected');
  };

  const clearLogs = () => {
    setLogs([]);
    setTranscript('');
    setLiveTranscript('');
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'secondary';
    return status ? 'default' : 'destructive';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Deepgram Debug Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">API Key</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(apiKeyValid)}
                <Badge variant={getStatusColor(apiKeyValid)}>
                  {apiKeyValid === null ? 'Not tested' : apiKeyValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Audio Permission</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(audioPermission)}
                <Badge variant={getStatusColor(audioPermission)}>
                  {audioPermission === null ? 'Not tested' : audioPermission ? 'Granted' : 'Denied'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Connection</span>
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {connectionStatus === 'connecting' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                {connectionStatus === 'idle' && <AlertCircle className="w-4 h-4 text-gray-400" />}
                <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                  {connectionStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={testApiKey} variant="outline" size="sm">
              Test API Key
            </Button>
            <Button onClick={testAudioPermission} variant="outline" size="sm">
              Test Audio
            </Button>
            <Button 
              onClick={connectToDeepgram} 
              disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
              size="sm"
            >
              Connect
            </Button>
            <Button 
              onClick={startListening} 
              disabled={!isConnected || isListening}
              size="sm"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Listening
            </Button>
            <Button 
              onClick={stopListening} 
              disabled={!isListening}
              variant="outline"
              size="sm"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </Button>
            <Button onClick={disconnect} variant="outline" size="sm">
              Disconnect
            </Button>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {(transcript || liveTranscript) && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transcript && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">Final Transcript:</div>
                  <div className="text-sm">{transcript}</div>
                </div>
              )}
              {liveTranscript && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Live Transcript:</div>
                  <div className="text-sm italic">{liveTranscript}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run some tests to see debug information.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepgramDebugTest;