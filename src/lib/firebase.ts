// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Removed storage export since billing is not enabled

// File handling utilities (without Firebase Storage)
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const saveResumeToFirestore = async (userId: string, resumeData: {
  fileName: string;
  fileContent: string; // Base64 string
  fileType: string;
  uploadedAt: Date;
}) => {
  // Save resume data directly to Firestore
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'resumes', userId), resumeData);
};

// API Configuration
export const apiConfig = {
  azureOpenAI: {
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "",
    apiKey: import.meta.env.VITE_AZURE_OPENAI_KEY || "",
    deploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4",
    apiVersion: import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2024-12-01-preview"
  },
  murf: {
    apiKey: import.meta.env.VITE_MURF_API_KEY || "ap2_497be65f-2231-4923-b2a8-606d27a678d0",
    baseUrl: "https://api.murf.ai/v1"
  },
  deepgram: {
    apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || "fbd22617acd9420c8912b0a033399c9ca05dfd45",
    baseUrl: "https://api.deepgram.com/v1"
  },
  livekit: {
    url: import.meta.env.VITE_LIVEKIT_URL || "ws://127.0.0.1:7880",
    apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || "devkey",
    apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || "secret"
  }
};

// Default Admin User Configuration
export const DEFAULT_ADMIN = {
  email: import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || "admin@careermitra.com",
  password: import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || "Admin@123",
  role: "admin",
  displayName: "CareerMitra Administrator"
};

// Helper functions for API calls
export const makeAzureOpenAIRequest = async (prompt: string) => {
  // TODO: Implement Azure OpenAI API call
  console.log("Azure OpenAI request:", prompt);
  return { response: "Mock AI response" };
};

export const makeMurfRequest = async (text: string) => {
  // TODO: Implement Murf AI API call
  console.log("Murf AI request:", text);
  return { audioUrl: "mock-audio-url" };
};

export const makeDeepgramRequest = async (audioBlob: Blob) => {
  // TODO: Implement Deepgram API call
  console.log("Deepgram request:", audioBlob);
  return { transcript: "Mock transcript" };
};