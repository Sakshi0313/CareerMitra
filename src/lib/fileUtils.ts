// File handling utilities for hackathon (without Firebase Storage)

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF, DOC, and DOCX files are allowed' };
  }

  // Check file size (5MB limit for hackathon)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
};

export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case 'application/pdf':
      return '📄';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '📝';
    default:
      return '📎';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Alternative storage options for hackathon
export const storageOptions = {
  // Option 1: Store in Firestore as Base64 (Current implementation)
  firestore: {
    name: 'Firestore Base64',
    description: 'Store files as Base64 strings in Firestore',
    pros: ['No billing required', 'Easy to implement', 'Works with free tier'],
    cons: ['Limited file size', 'Increases document size'],
    maxSize: '5MB'
  },

  // Option 2: Use browser localStorage (for demo only)
  localStorage: {
    name: 'Browser Storage',
    description: 'Store files in browser localStorage',
    pros: ['No server required', 'Instant access', 'Perfect for demo'],
    cons: ['Lost on browser clear', 'Very limited size', 'Not persistent'],
    maxSize: '1MB'
  },

  // Option 3: Use external free services
  external: {
    name: 'External Services',
    description: 'Use services like Cloudinary, Imgur, etc.',
    pros: ['Larger file limits', 'CDN delivery', 'Professional features'],
    cons: ['Requires API keys', 'May have usage limits', 'External dependency'],
    maxSize: '10MB+'
  }
};

// For hackathon demo - store in localStorage as backup
export const saveToLocalStorage = (key: string, data: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('LocalStorage save failed:', error);
    return false;
  }
};

export const loadFromLocalStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('LocalStorage load failed:', error);
    return null;
  }
};