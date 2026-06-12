// Test script to verify Deepgram connection
import DeepgramService from './deepgramService';

export const testDeepgramConnection = async (): Promise<boolean> => {
  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    console.error('Deepgram API key not found');
    return false;
  }

  try {
    console.log('Testing Deepgram connection...');
    
    const deepgramService = new DeepgramService({
      apiKey,
      model: 'nova-2',
      language: 'en',
      smartFormat: true,
      interimResults: true,
      endpointing: 500
    });

    // Set up event listeners
    deepgramService.onOpen(() => {
      console.log('✅ Deepgram connection successful!');
    });

    deepgramService.onError((error) => {
      console.error('❌ Deepgram connection error:', error);
    });

    // Try to connect
    const connected = await deepgramService.connect();
    
    if (connected) {
      console.log('✅ Deepgram service initialized successfully');
      deepgramService.disconnect();
      return true;
    } else {
      console.error('❌ Failed to connect to Deepgram');
      return false;
    }
  } catch (error) {
    console.error('❌ Deepgram test failed:', error);
    return false;
  }
};

// Test API key validity
export const testDeepgramApiKey = async (): Promise<boolean> => {
  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Deepgram API key not found in environment variables');
    return false;
  }

  try {
    const isValid = await DeepgramService.testApiKey(apiKey);
    
    if (isValid) {
      console.log('✅ Deepgram API key is valid');
    } else {
      console.error('❌ Deepgram API key is invalid or expired');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error testing Deepgram API key:', error);
    return false;
  }
};