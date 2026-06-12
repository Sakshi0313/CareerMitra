import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, DEFAULT_ADMIN } from './firebase';

export const initializeDefaultAdmin = async () => {
  try {
    const adminDocRef = doc(db, 'users', 'admin');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      // Create default admin user in Firestore
      await setDoc(adminDocRef, {
        uid: 'admin',
        email: DEFAULT_ADMIN.email,
        displayName: DEFAULT_ADMIN.displayName,
        role: 'admin',
        createdAt: new Date(),
        profileComplete: true,
        status: 'active'
      });
      
      console.log('✅ Default admin user created in Firestore');
      return true;
    } else {
      console.log('ℹ️ Default admin user already exists');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing default admin:', error);
    throw error;
  }
};

export const setupFirebaseRules = () => {
  console.log(`
🔥 Firebase Security Rules Setup Required:

Add these rules to your Firestore Security Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow users to read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow admin to read/write all user profiles
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Allow recruiters to read student profiles (for search)
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'recruiter' &&
        resource.data.role == 'student';
    }
    
    // Interviews collection
    match /interviews/{interviewId} {
      allow read, write: if request.auth != null;
    }
    
    // Resumes collection  
    match /resumes/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}

🔐 Firebase Authentication Setup:
1. Enable Email/Password authentication
2. Enable Google Sign-in (optional)
3. Set up email verification (recommended)

📁 Firebase Storage Rules:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /profile-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
  `);
};

export const createSampleData = async () => {
  try {
    // This function can be used to create sample data for testing
    console.log('Creating sample data...');
    
    // You can add sample students, recruiters, etc. here for testing
    // This is optional and should be removed in production
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};