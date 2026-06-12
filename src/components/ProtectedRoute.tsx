import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser || !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    // Redirect based on user role
    if (userProfile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userProfile.role === 'recruiter') {
      return <Navigate to="/recruiter" replace />;
    } else if (userProfile.role === 'student') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;