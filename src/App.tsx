import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleAuthProvider, useAuth } from "@/contexts/SimpleAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import ATSAnalyzer from "./pages/ATSAnalyzer";
import SimpleATSAnalyzer from "./pages/SimpleATSAnalyzer";
import CareerRoadmap from "./pages/CareerRoadmap";
import MockInterview from "./pages/MockInterview";
import Opportunities from "./pages/Opportunities";
import AdminDashboard from "./pages/AdminDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import TestFirebase from "./pages/TestFirebase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Main app routes component
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/test-firebase" element={<TestFirebase />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/roadmap" element={
        <ProtectedRoute allowedRoles={['student']}>
          <CareerRoadmap />
        </ProtectedRoute>
      } />
      <Route path="/opportunities" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Opportunities />
        </ProtectedRoute>
      } />
      <Route path="/resume-builder" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ResumeBuilder />
        </ProtectedRoute>
      } />
      <Route path="/ats-analyzer" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ATSAnalyzer />
        </ProtectedRoute>
      } />
      <Route path="/simple-ats" element={
        <ProtectedRoute allowedRoles={['student']}>
          <SimpleATSAnalyzer />
        </ProtectedRoute>
      } />
      <Route path="/mock-interview" element={
        <ProtectedRoute allowedRoles={['student']}>
          <MockInterview />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/recruiter" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <RecruiterDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SimpleAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SimpleAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
