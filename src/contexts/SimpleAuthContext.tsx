import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'student' | 'recruiter';
  createdAt: Date;
  profileComplete?: boolean;
  status?: 'active' | 'pending' | 'approved' | 'rejected';
  
  // Student-specific fields
  targetRoles?: string[];
  college?: string;
  university?: string;
  location?: string;
  mobileNumber?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  bio?: string;
  currentRole?: string;
  experience?: string;
  salary?: string;
  degree?: string;
  graduationYear?: string;
  workType?: string;
  preferredLocations?: string;
  companySize?: string;
  isPublic?: boolean;
  
  // Recruiter-specific fields
  companyName?: string;
  website?: string;
  employees?: string;
  phoneNumber?: string;
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileContent: string;
    uploadedAt: Date;
  }>;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  isRecruiter: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || ''
        };
        setCurrentUser(user);

        // Load user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setUserProfile(profileData);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Check for admin login (special case)
      if (email === "admin@careermitra.com" && password === "Admin@123") {
        const adminUser = {
          uid: 'admin',
          email: 'admin@careermitra.com',
          displayName: 'Admin User'
        };
        const adminProfile = {
          uid: 'admin',
          email: 'admin@careermitra.com',
          displayName: 'Admin User',
          role: 'admin' as const,
          createdAt: new Date(),
          profileComplete: true,
          status: 'active' as const
        };
        setCurrentUser(adminUser);
        setUserProfile(adminProfile);
        return;
      }

      // For regular users, use Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Load user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        
        // Check if recruiter is approved
        if (profileData.role === 'recruiter' && profileData.status === 'pending') {
          // Sign out the user since they're not approved yet
          await signOut(auth);
          throw new Error('Your recruiter account is pending admin approval. Please wait for approval before logging in.');
        }
        
        if (profileData.role === 'recruiter' && profileData.status === 'rejected') {
          // Sign out the user since they're rejected
          await signOut(auth);
          throw new Error('Your recruiter account has been rejected. Please contact support for more information.');
        }
        
        setUserProfile(profileData);
      } else {
        throw new Error('User profile not found');
      }
      
      console.log('User logged in successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.message.includes('pending admin approval') || error.message.includes('rejected')) {
        throw error; // Re-throw our custom approval messages
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<UserProfile> & { 
    companyName?: string; 
    companyWebsite?: string; 
    companySize?: string; 
    location?: string; 
    phoneNumber?: string;
    companyDocument?: File;
    profileImage?: File;
  }) => {
    try {
      setLoading(true);
      
      // Check if email already exists in Firestore (for better error handling)
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email));
      const existingUsers = await getDocs(emailQuery);
      
      if (!existingUsers.empty) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      }
      
      // Validate recruiter requirements
      if (userData.role === 'recruiter') {
        if (!userData.companyName?.trim()) {
          throw new Error('Company name is required for recruiters');
        }
        if (!userData.companyDocument) {
          throw new Error('Company verification document is required for recruiters');
        }
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(userData.companyDocument.type)) {
          throw new Error('Please upload a valid document (PDF, DOC, DOCX, JPG, PNG)');
        }
        // Validate file size (5MB)
        if (userData.companyDocument.size > 5 * 1024 * 1024) {
          throw new Error('Document size must be less than 5MB');
        }
      }
      
      // Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName || ''
      });
      
      // Prepare profile data for Firestore
      const profileData: any = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userData.displayName || '',
        role: userData.role || 'student',
        createdAt: new Date(),
        profileComplete: false,
        status: userData.role === 'recruiter' ? 'pending' : 'active'
      };

      // Add student-specific data
      if (userData.role === 'student') {
        profileData.targetRoles = userData.targetRoles || [];
        profileData.college = userData.college || '';
        profileData.university = userData.college || '';
        profileData.location = userData.location || '';
        profileData.mobileNumber = userData.mobileNumber || '';
        profileData.linkedinUrl = userData.linkedinUrl || '';
        profileData.githubUrl = userData.githubUrl || '';
        profileData.portfolioUrl = userData.portfolioUrl || '';
        profileData.skills = userData.skills || [];
        profileData.bio = '';
        profileData.currentRole = 'Student';
        profileData.experience = '0-1';
        profileData.salary = '';
        profileData.degree = '';
        profileData.graduationYear = '';
        profileData.workType = 'hybrid';
        profileData.preferredLocations = '';
        profileData.companySize = 'any';
        profileData.isPublic = true;
        
        // Handle profile image upload
        if (userData.profileImage) {
          const { convertFileToBase64 } = await import('@/lib/firebase');
          const base64Image = await convertFileToBase64(userData.profileImage);
          profileData.profileImage = {
            fileName: userData.profileImage.name,
            fileType: userData.profileImage.type,
            fileContent: base64Image,
            uploadedAt: new Date()
          };
        }
      }

      // Add recruiter-specific data
      if (userData.role === 'recruiter') {
        profileData.companyName = userData.companyName;
        profileData.website = userData.companyWebsite || '';
        profileData.employees = userData.companySize || '';
        profileData.location = userData.location || 'India';
        profileData.phoneNumber = userData.phoneNumber || '+91 XXXXXXXXXX';
        
        // Handle document upload
        if (userData.companyDocument) {
          const { convertFileToBase64 } = await import('@/lib/firebase');
          const base64Document = await convertFileToBase64(userData.companyDocument);
          profileData.documents = [{
            fileName: userData.companyDocument.name,
            fileType: userData.companyDocument.type,
            fileContent: base64Document,
            uploadedAt: new Date()
          }];
        }
      }

      // Save profile to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), profileData);
      
      // Initialize user stats for students
      if (userData.role === 'student') {
        const defaultStats = {
          atsScore: 0,
          mockInterviews: 0,
          skillsCount: userData.skills?.length || 0,
          roadmapProgress: 0,
          profileCompleteness: calculateProfileCompleteness(profileData)
        };
        await setDoc(doc(db, 'userStats', firebaseUser.uid), defaultStats);
      }
      
      setUserProfile(profileData);
      
      console.log('User registered successfully:', profileData);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      } else if (error.message.includes('Company') || error.message.includes('document') || error.message.includes('Document') || error.message.includes('email already exists')) {
        // Re-throw our custom validation errors
        throw error;
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = (profile: any) => {
    if (!profile) return 0;
    
    let completeness = 0;
    const fields = ['displayName', 'email'];
    
    fields.forEach(field => {
      if (profile[field]) {
        completeness += 50; // Each field is worth 50%
      }
    });
    
    return Math.min(completeness, 100);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = () => userProfile?.role === 'admin';
  const isStudent = () => userProfile?.role === 'student';
  const isRecruiter = () => userProfile?.role === 'recruiter';

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isStudent,
    isRecruiter
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};