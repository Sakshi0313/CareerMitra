import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TestFirebase = () => {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test123");

  const testFirebaseConnection = async () => {
    setLoading(true);
    setTestResult("Testing Firebase connection...");
    
    try {
      // Test Firebase import
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      setTestResult("Firebase imports successful. Testing database connection...");
      
      // Test database connection
      const usersQuery = collection(db, 'users');
      const snapshot = await getDocs(usersQuery);
      
      setTestResult(`Firebase connection successful! Found ${snapshot.docs.length} users in database.`);
      
      // Log the data
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Firebase test - Users found:', users);
      
    } catch (error) {
      console.error('Firebase test error:', error);
      setTestResult(`Firebase connection failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateAuthUser = async () => {
    setLoading(true);
    setTestResult("Creating Firebase Auth user...");
    
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile
      await updateProfile(firebaseUser, {
        displayName: 'Test User'
      });
      
      // Create Firestore document
      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: 'Test User',
        role: 'student',
        createdAt: new Date(),
        status: 'active'
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), profileData);
      
      setTestResult(`Firebase Auth user created successfully! UID: ${firebaseUser.uid}`);
      
    } catch (error: any) {
      console.error('Create auth user test error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setTestResult('User already exists with this email');
      } else {
        setTestResult(`Create auth user failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    setTestResult("Testing sign in...");
    
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setTestResult(`Sign in successful! User: ${user.email} (${user.uid})`);
      
    } catch (error: any) {
      console.error('Sign in test error:', error);
      setTestResult(`Sign in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Firebase Authentication & Firestore Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Test Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Test Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={testFirebaseConnection}
              disabled={loading}
            >
              Test Firestore Connection
            </Button>
            <Button 
              onClick={testCreateAuthUser}
              disabled={loading}
              variant="outline"
            >
              Create Auth User
            </Button>
            <Button 
              onClick={testSignIn}
              disabled={loading}
              variant="secondary"
            >
              Test Sign In
            </Button>
          </div>
          
          {testResult && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{testResult}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFirebase;