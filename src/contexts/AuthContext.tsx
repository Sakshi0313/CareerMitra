import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, DEFAULT_ADMIN } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'student' | 'recruiter';
  createdAt: Date;
  profileComplete?: boolean;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize default admin user
  const initializeDefaultAdmin = async () => {
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
          profileComplete: true
        });
        console.log('Default admin user created in Firestore');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Check if it's the default admin login
      if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
        // Set admin user profile directly
        const adminProfile: UserProfile = {
          uid: 'admin',
          email: DEFAULT_ADMIN.email,
          displayName: DEFAULT_ADMIN.displayName,
          role: 'admin',
          createdAt: new Date(),
          profileComplete: true
        };
        setUserProfile(adminProfile);
        
        // Create a mock user object for admin
        const mockAdminUser = {
          uid: 'admin',
          email: DEFAULT_ADMIN.email,
          displayName: DEFAULT_ADMIN.displayName,
        } as User;
        setCurrentUser(mockAdminUser);
        return;
      }

      // Regular Firebase authentication for other users
      const result = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(result.user.uid);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (userData.displayName) {
        await updateProfile(result.user, {
          displayName: userData.displayName
        });
      }

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: userData.displayName || '',
        role: userData.role || 'student',
        createdAt: new Date(),
        profileComplete: false
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.uid === 'admin') {
        // Handle admin logout
        setCurrentUser(null);
        setUserProfile(null);
        return;
      }
      
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const isAdmin = () => userProfile?.role === 'admin';
  const isStudent = () => userProfile?.role === 'student';
  const isRecruiter = () => userProfile?.role === 'recruiter';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid !== 'admin') {
        setCurrentUser(user);
        await loadUserProfile(user.uid);
      } else if (!user && currentUser?.uid !== 'admin') {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Initialize default admin
    initializeDefaultAdmin();

    return unsubscribe;
  }, [currentUser]);

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
      {!loading && children}
    </AuthContext.Provider>
  );
};