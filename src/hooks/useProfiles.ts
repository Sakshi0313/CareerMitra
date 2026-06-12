import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'recruiter';
  avatar?: string;
  company?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience?: number;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribesRef = useRef<{ [userId: string]: () => void }>({});
  const loadedProfilesRef = useRef<Set<string>>(new Set());

  // Get a single profile by ID
  const getProfileById = useCallback((userId: string): UserProfile | undefined => {
    return profiles[userId];
  }, [profiles]);

  // Load profile data
  const loadProfile = useCallback((userId: string) => {
    if (!userId) {
      console.log('useProfiles: No userId provided');
      return;
    }

    // Avoid loading the same profile multiple times
    if (loadedProfilesRef.current.has(userId)) {
      console.log('useProfiles: Profile already loaded:', userId);
      return;
    }

    console.log('useProfiles: Loading profile for userId:', userId);
    setLoading(true);

    try {
      loadedProfilesRef.current.add(userId);

      // Try to get from users collection first
      const userRef = doc(db, 'users', userId);
      
      const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data() as UserProfile;
          console.log('useProfiles: Profile loaded successfully:', userId, userData);
          
          setProfiles(prev => ({
            ...prev,
            [userId]: {
              uid: userId,
              ...userData
            }
          }));
          setError(null);
        } else {
          // If not found in users, create a default profile
          console.log('useProfiles: User document not found:', userId);
          setProfiles(prev => ({
            ...prev,
            [userId]: {
              uid: userId,
              name: 'Unknown User',
              email: '',
              role: 'student',
              avatar: '',
              company: ''
            }
          }));
        }
        setLoading(false);
      }, (err: any) => {
        console.error('useProfiles: Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      });

      unsubscribesRef.current[userId] = unsubscribe;

      return unsubscribe;
    } catch (err: any) {
      console.error('useProfiles: Error setting up profile subscription:', err);
      setError(err.message || 'Failed to load profile');
      setLoading(false);
      return undefined;
    }
  }, []);

  // Search profiles
  const searchProfiles = useCallback(async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      console.log('useProfiles: Searching profiles with term:', searchTerm);
      
      const usersRef = collection(db, 'users');
      // Note: Firestore doesn't support full-text search, so we'd need to implement this
      // on the client side or use a service like Algolia
      // For now, return empty results
      return [];
    } catch (err: any) {
      console.error('useProfiles: Error searching profiles:', err);
      return [];
    }
  }, []);

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      console.log('useProfiles: Cleaning up all subscriptions');
      
      Object.values(unsubscribesRef.current).forEach(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
      
      unsubscribesRef.current = {};
      loadedProfilesRef.current.clear();
    };
  }, []);

  return {
    profiles,
    getProfileById,
    loadProfile,
    searchProfiles,
    loading,
    error
  };
}
