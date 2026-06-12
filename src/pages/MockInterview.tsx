import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import VideoInterviewAnalyzer from "@/components/interview/VideoInterviewAnalyzer";
import AIVideoInterview from "@/components/interview/AIVideoInterview";
import AIAudioInterview from "@/components/interview/AIAudioInterview";
import { toast } from "sonner";
import { 
  Video, 
  Play, 
  Square, 
  RotateCcw, 
  Award, 
  Clock, 
  Target,
  TrendingUp,
  Brain,
  Star,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Eye,
  Smile,
  Activity,
  Phone,
  Settings,
  CheckCircle,
  AlertTriangle,
  Zap,
  Users,
  BookOpen,
  Mic,
  Send,
  Download,
  FileText
} from "lucide-react";

import { interviewAnalysisService, type InterviewQuestion, type AnswerAnalysisResult } from "@/lib/interviewAnalysisService";
import { interviewStorageService, type StoredInterviewSession } from "@/lib/interviewStorageService";
import { interviewQuestionsService } from "@/lib/interviewQuestionsService";
import { useAuth } from "@/contexts/SimpleAuthContext";

interface BodyLanguageMetrics {
  eyeContact: number;
  facialExpression: 'neutral' | 'positive' | 'negative' | 'confused';
  handGestures: number;
  posture: 'good' | 'slouching' | 'leaning';
  confidence: number;
  engagement: number;
  nervousness: number;
}

interface InterviewSession {
  id: string;
  role: string;
  level: string;
  mode: 'practice' | 'ai-audio' | 'ai-video';
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
    timeSpent: number;
    analysisResult?: AnswerAnalysisResult;
    bodyLanguageScore?: number;
  }>;
  bodyLanguageMetrics?: BodyLanguageMetrics[];
  startTime: Date;
  status: 'setup' | 'active' | 'completed';
  overallScore: number;
  bodyLanguageScore: number;
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
}

const MockInterview = () => {
  const { currentUser, userProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [interviewMode, setInterviewMode] = useState<'practice' | 'ai-audio' | 'ai-video'>('practice');
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [bodyLanguageMetrics, setBodyLanguageMetrics] = useState<BodyLanguageMetrics | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<StoredInterviewSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<StoredInterviewSession | null>(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Enhanced role-based interview questions with real API analysis
  const generateInterviewQuestions = (role: string, difficulty: string): InterviewQuestion[] => {
    return interviewAnalysisService.generateInterviewQuestions(role, difficulty);
  };

  // Get available roles based on student's target roles and resume analysis
  const getAvailableRoles = () => {
    // All available roles with categories and descriptions
    const allRoles = [
      { value: "frontend", label: "Frontend Developer", category: "Development", description: "Build user interfaces and web applications" },
      { value: "backend", label: "Backend Developer", category: "Development", description: "Develop server-side logic and APIs" },
      { value: "fullstack", label: "Full Stack Developer", category: "Development", description: "Work on both frontend and backend" },
      { value: "mobile", label: "Mobile Developer", category: "Development", description: "Create mobile applications for iOS/Android" },
      { value: "software-engineer", label: "Software Engineer", category: "Development", description: "Design and develop software systems" },
      { value: "game-developer", label: "Game Developer", category: "Development", description: "Create video games and interactive media" },
      { value: "blockchain-developer", label: "Blockchain Developer", category: "Development", description: "Build decentralized applications" },
      
      { value: "devops", label: "DevOps Engineer", category: "Infrastructure", description: "Manage deployment and infrastructure" },
      { value: "cloud-engineer", label: "Cloud Engineer", category: "Infrastructure", description: "Design and manage cloud solutions" },
      { value: "cybersecurity", label: "Cybersecurity Analyst", category: "Security", description: "Protect systems from security threats" },
      
      { value: "data-science", label: "Data Scientist", category: "Data & AI", description: "Analyze data and build ML models" },
      { value: "data-analyst", label: "Data Analyst", category: "Data & AI", description: "Interpret data and generate insights" },
      { value: "machine-learning", label: "ML Engineer", category: "Data & AI", description: "Build and deploy machine learning systems" },
      
      { value: "qa-engineer", label: "QA Engineer", category: "Quality", description: "Test software quality and functionality" },
      
      { value: "ui-ux-designer", label: "UI/UX Designer", category: "Design", description: "Design user interfaces and experiences" },
      
      { value: "product-manager", label: "Product Manager", category: "Management", description: "Manage product development lifecycle" },
      { value: "project-manager", label: "Project Manager", category: "Management", description: "Coordinate projects and teams" },
      
      { value: "business-analyst", label: "Business Analyst", category: "Analysis", description: "Analyze business requirements" },
      
      { value: "technical-writer", label: "Technical Writer", category: "Communication", description: "Create technical documentation" },
      { value: "sales-engineer", label: "Sales Engineer", category: "Sales", description: "Provide technical sales support" }
    ];

    // Priority 1: If user has target roles from profile, show those first
    if (userProfile?.targetRoles && userProfile.targetRoles.length > 0) {
      const targetRoleValues = userProfile.targetRoles.map(role => role.toLowerCase().replace(/\s+/g, '-'));
      const profileRoles = allRoles.filter(role => 
        targetRoleValues.some(targetRole => 
          role.value.includes(targetRole) || 
          targetRole.includes(role.value) ||
          role.label.toLowerCase().includes(targetRole.replace('-', ' '))
        )
      );
      
      if (profileRoles.length > 0) {
        // Return profile roles first, then other roles
        const otherRoles = allRoles.filter(role => !profileRoles.some(pr => pr.value === role.value));
        return [...profileRoles, ...otherRoles];
      }
    }

    // Priority 2: Show roles based on resume analysis (from localStorage or recent analysis)
    try {
      const resumeAnalysis = localStorage.getItem('resumeAnalysis');
      if (resumeAnalysis) {
        const analysis = JSON.parse(resumeAnalysis);
        if (analysis.roleMatches && analysis.roleMatches.length > 0) {
          // Get top matching roles (above 50% match)
          const matchingRoles = analysis.roleMatches
            .filter(match => match.matchPercentage >= 50)
            .map(match => match.role.toLowerCase().replace(/\s+/g, '-'));
          
          const resumeBasedRoles = allRoles.filter(role => 
            matchingRoles.some(matchRole => 
              role.value.includes(matchRole) || 
              matchRole.includes(role.value) ||
              role.label.toLowerCase().replace(/\s+/g, '-') === matchRole
            )
          );
          
          if (resumeBasedRoles.length > 0) {
            // Return resume-based roles first, then other roles
            const otherRoles = allRoles.filter(role => !resumeBasedRoles.some(rr => rr.value === role.value));
            return [...resumeBasedRoles, ...otherRoles];
          }
        }
      }
    } catch (error) {
      console.log('No resume analysis found, showing all roles');
    }

    // Priority 3: Return all roles if no specific targeting is available
    return allRoles;
  };

  const availableRoles = getAvailableRoles();

  // Filter roles based on search term
  const filteredRoles = availableRoles.filter(role =>
    role.label.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
    role.category.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(roleSearchTerm.toLowerCase())
  );

  // Group roles by category for better organization
  const rolesByCategory = filteredRoles.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }
    acc[role.category].push(role);
    return acc;
  }, {} as { [category: string]: typeof availableRoles });

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRole(roleValue);
    setShowRoleSelector(false);
  };

  // Load user's interview history and analytics
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserData();
    } else {
      // Clear data if user is not authenticated
      setRecentSessions([]);
      setAnalytics(null);
      setIsLoadingHistory(false);
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoadingHistory(true);
    try {
      const [interviews, userAnalytics] = await Promise.all([
        interviewStorageService.getUserInterviews(currentUser.uid),
        interviewStorageService.getUserAnalytics(currentUser.uid)
      ]);
      
      setRecentSessions(interviews);
      setAnalytics(userAnalytics);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Don't show error toast for empty collections - this is normal for new users
      if (error.message && !error.message.includes('No documents found')) {
        toast.error('Failed to load interview history');
      }
      // Set empty data as fallback
      setRecentSessions([]);
      setAnalytics({
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        averageBodyLanguageScore: 0,
        averageCompletionRate: 0,
        roleBreakdown: {},
        scoreDistribution: {
          '0-20': 0,
          '21-40': 0,
          '41-60': 0,
          '61-80': 0,
          '81-100': 0
        },
        recentTrend: 0
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (currentSession?.status === 'active' && timeLeft > 0 && interviewMode === 'practice') {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentSession?.status === 'active' && interviewMode === 'practice') {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, currentSession?.status, interviewMode]);

  const startInterview = async () => {
    if (!selectedRole || !difficulty) {
      toast.error("Please select both role and difficulty level");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Please log in to start an interview");
      return;
    }

    // Generate questions using the new service
    const questions = generateInterviewQuestions(selectedRole, difficulty);
    if (questions.length === 0) {
      toast.error("No questions available for this combination");
      return;
    }

    const session: InterviewSession = {
      id: Date.now().toString(),
      role: selectedRole,
      level: difficulty,
      mode: interviewMode,
      questions: questions,
      currentQuestionIndex: 0,
      answers: [],
      bodyLanguageMetrics: [],
      startTime: new Date(),
      status: 'active',
      overallScore: 0,
      bodyLanguageScore: 0
    };

    setCurrentSession(session);
    
    // Save interview session to Firebase
    try {
      const interviewId = await interviewStorageService.saveInterview({
        userId: currentUser.uid,
        role: selectedRole,
        level: difficulty,
        mode: interviewMode,
        questions: questions,
        answers: [],
        bodyLanguageMetrics: [],
        startTime: new Date(),
        status: 'active',
        overallScore: 0,
        bodyLanguageScore: 0,
        completionPercentage: 0,
        totalQuestions: questions.length,
        answeredQuestions: 0,
        duration: 0
      });
      
      setCurrentInterviewId(interviewId);
      console.log('Interview session saved with ID:', interviewId);
    } catch (error) {
      console.error('Failed to save interview session:', error);
      toast.error('Failed to save interview session');
    }
    
    if (interviewMode === 'practice') {
      setTimeLeft(questions[0].timeLimit);
      startTimeRef.current = new Date();
    }
    
    setShowFeedback(false);
    
    toast.success(`${interviewMode === 'ai-video' ? 'AI Video Call' : interviewMode === 'ai-audio' ? 'AI Audio Call' : 'Practice'} interview started!`);
  };

  const handleTimeUp = () => {
    if (currentAnswer.trim()) {
      submitAnswer();
    } else {
      toast.warning("Time's up! Moving to next question.");
      nextQuestion();
    }
  };

  const submitAnswer = async () => {
    if (!currentSession || !currentAnswer.trim()) return;

    setIsAnalyzing(true);
    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    const timeSpent = startTimeRef.current ? 
      Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) : 0;

    try {
      // Use real AI analysis for practice mode
      const analysisResult = await interviewAnalysisService.analyzeAnswer({
        answer: currentAnswer,
        question: currentQuestion,
        role: currentSession.role,
        difficulty: currentSession.level,
        timeSpent: timeSpent
      });

      // Only calculate body language score for AI video mode
      const bodyLanguageScore = (interviewMode === 'ai-video' && bodyLanguageMetrics) ? 
        calculateBodyLanguageScore(bodyLanguageMetrics) : undefined;

      const newAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: currentAnswer,
        score: analysisResult.score,
        feedback: analysisResult.feedback,
        timeSpent: timeSpent,
        analysisResult: analysisResult,
        bodyLanguageScore: bodyLanguageScore
      };

      const updatedSession = {
        ...currentSession,
        answers: [...currentSession.answers, newAnswer],
        bodyLanguageMetrics: (interviewMode === 'ai-video' && bodyLanguageMetrics) ? 
          [...(currentSession.bodyLanguageMetrics || []), bodyLanguageMetrics] : 
          currentSession.bodyLanguageMetrics
      };

      setCurrentSession(updatedSession);
      
      // Update interview in Firebase
      if (currentInterviewId && currentUser?.uid) {
        try {
          const completionPercentage = interviewStorageService.calculateCompletionPercentage(
            updatedSession.answers.length, 
            updatedSession.questions.length
          );
          
          const duration = interviewStorageService.calculateDuration(updatedSession.startTime);
          
          await interviewStorageService.updateInterview(currentInterviewId, {
            answers: updatedSession.answers,
            bodyLanguageMetrics: updatedSession.bodyLanguageMetrics,
            completionPercentage,
            answeredQuestions: updatedSession.answers.length,
            duration,
            status: 'active'
          });
          
          console.log('Interview progress updated in Firebase');
        } catch (error) {
          console.error('Failed to update interview progress:', error);
        }
      }
      
      setShowFeedback(true);
      setIsAnalyzing(false);
      
      // Show success message with score
      toast.success(`Answer analyzed! Score: ${analysisResult.score}%`, {
        description: `Communication: ${analysisResult.communicationScore}% | Completeness: ${analysisResult.completeness}%`
      });
      
    } catch (error) {
      console.error('Answer analysis failed:', error);
      setIsAnalyzing(false);
      toast.error('Analysis failed. Please try again.');
    }
  };

  const calculateBodyLanguageScore = (metrics: BodyLanguageMetrics): number => {
    const eyeContactWeight = 0.3;
    const confidenceWeight = 0.25;
    const engagementWeight = 0.2;
    const postureWeight = 0.15;
    const nervousnessWeight = 0.1; // Negative impact
    
    const postureScore = metrics.posture === 'good' ? 100 : metrics.posture === 'leaning' ? 70 : 50;
    
    return Math.round(
      (metrics.eyeContact * eyeContactWeight) +
      (metrics.confidence * confidenceWeight) +
      (metrics.engagement * engagementWeight) +
      (postureScore * postureWeight) -
      (metrics.nervousness * nervousnessWeight)
    );
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      const nextIndex = currentSession.currentQuestionIndex + 1;
      const nextQuestion = currentSession.questions[nextIndex];
      
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex
      });
      
      setCurrentAnswer("");
      if (interviewMode === 'practice') {
        setTimeLeft(nextQuestion.timeLimit);
        startTimeRef.current = new Date();
      }
      setShowFeedback(false);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    // Check if we have results from AI interview components (new approach)
    try {
      const lastInterviewResult = localStorage.getItem('lastInterviewResult');
      if (lastInterviewResult) {
        const result = JSON.parse(lastInterviewResult);
        console.log('Retrieved interview result from localStorage:', result);
        
        // Create a proper session object for display
        const completedSession: InterviewSession = {
          id: Date.now().toString(),
          role: result.role,
          level: result.difficulty,
          mode: result.type === 'audio' ? 'ai-audio' : 'ai-video',
          questions: [], // Will be populated if needed
          currentQuestionIndex: 0,
          answers: [], // Will be populated if needed
          startTime: new Date(result.timestamp),
          status: 'completed',
          overallScore: result.averageScore,
          bodyLanguageScore: 0 // Audio interviews don't have body language
        };
        
        // Set the session to show results
        setCurrentSession(completedSession);
        
        // Show success message with actual scores
        toast.success(`Interview completed! Overall Score: ${result.averageScore}% | Questions Answered: ${result.questionsAnswered}/${result.totalQuestions}`);
        
        // Clear the temporary result
        localStorage.removeItem('lastInterviewResult');
        
        // Don't reset to practice mode immediately - let user see results
        return;
      }
    } catch (error) {
      console.error('Failed to retrieve interview results from localStorage:', error);
    }

    // Fallback to old session-based approach if no localStorage results
    if (!currentSession) return;

    const totalScore = currentSession.answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = Math.round(totalScore / currentSession.answers.length);
    
    const bodyLanguageScores = currentSession.answers.filter(a => a.bodyLanguageScore).map(a => a.bodyLanguageScore!);
    const averageBodyLanguageScore = bodyLanguageScores.length > 0 ? 
      Math.round(bodyLanguageScores.reduce((sum, score) => sum + score, 0) / bodyLanguageScores.length) : 0;

    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      overallScore: averageScore,
      bodyLanguageScore: averageBodyLanguageScore
    };

    setCurrentSession(completedSession);
    
    // Update interview as completed in Firebase
    if (currentInterviewId && currentUser?.uid) {
      try {
        const duration = interviewStorageService.calculateDuration(completedSession.startTime);
        
        await interviewStorageService.updateInterview(currentInterviewId, {
          status: 'completed',
          overallScore: averageScore,
          bodyLanguageScore: averageBodyLanguageScore,
          completionPercentage: 100,
          answeredQuestions: completedSession.answers.length,
          duration,
          endTime: new Date()
        });
        
        console.log('Interview completed and saved to Firebase');
        
        // Reload user data to update history and analytics
        await loadUserData();
      } catch (error) {
        console.error('Failed to save completed interview:', error);
        toast.error('Failed to save interview results');
      }
    }
    
    toast.success(`Interview completed! Overall Score: ${averageScore}% | Body Language: ${averageBodyLanguageScore}%`);
  };

  const resetInterview = async () => {
    // Save incomplete interview if there are answers
    if (currentSession && currentSession.answers.length > 0 && currentInterviewId && currentUser?.uid) {
      try {
        const completionPercentage = interviewStorageService.calculateCompletionPercentage(
          currentSession.answers.length, 
          currentSession.questions.length
        );
        
        const duration = interviewStorageService.calculateDuration(currentSession.startTime);
        
        await interviewStorageService.updateInterview(currentInterviewId, {
          status: 'abandoned',
          completionPercentage,
          answeredQuestions: currentSession.answers.length,
          duration,
          endTime: new Date()
        });
        
        console.log('Incomplete interview saved');
        
        // Reload user data to update history
        await loadUserData();
      } catch (error) {
        console.error('Failed to save incomplete interview:', error);
      }
    }
    
    setCurrentSession(null);
    setCurrentAnswer("");
    setTimeLeft(0);
    setShowFeedback(false);
    setIsAnalyzing(false);
    setBodyLanguageMetrics(null);
    setVideoStream(null);
    setCurrentInterviewId(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Export interview questions with answers
  const exportInterviewQuestions = (format: 'text' | 'html') => {
    if (!selectedRole || !difficulty) {
      toast.error("Please select role and difficulty first");
      return;
    }

    try {
      const questionsData = interviewQuestionsService.getInterviewQuestionsWithAnswers(selectedRole, difficulty);
      
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'text') {
        content = interviewQuestionsService.exportToText(questionsData);
        filename = `interview-questions-${selectedRole}-${difficulty}.txt`;
        mimeType = 'text/plain';
      } else {
        content = interviewQuestionsService.exportToHTML(questionsData);
        filename = `interview-questions-${selectedRole}-${difficulty}.html`;
        mimeType = 'text/html';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Interview questions exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export interview questions');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Format duration from seconds
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];
  const progress = currentSession ? ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              🎯 Advanced AI Mock Interview
            </h1>
            <p className="text-muted-foreground">
              Practice with text-based AI interviews and full video calls with real-time analysis
            </p>
          </div>

        <Tabs defaultValue="interview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="interview">Interview Practice</TabsTrigger>
            <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
            <TabsTrigger value="history">Interview History</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="space-y-6">
            {!currentSession || currentSession.status === 'setup' ? (
              // Setup Phase
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Advanced Interview Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Target Role</label>
                          {userProfile?.targetRoles && userProfile.targetRoles.length > 0 ? (
                            <div className="text-xs text-muted-foreground mb-2">
                              Showing roles based on your profile preferences: {userProfile.targetRoles.join(', ')}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground mb-2">
                              Showing roles based on your resume analysis and skills
                            </div>
                          )}
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => setShowRoleSelector(true)}
                          >
                            {selectedRole ? 
                              availableRoles.find(r => r.value === selectedRole)?.label || "Select role" : 
                              "Select role"
                            }
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy (Entry Level)</SelectItem>
                              <SelectItem value="medium">Medium (Mid Level)</SelectItem>
                              <SelectItem value="hard">Hard (Senior Level)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Interview Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                          <Card 
                            className={`cursor-pointer transition-all ${interviewMode === 'practice' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setInterviewMode('practice')}
                          >
                            <CardContent className="p-4 text-center">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                              <div className="font-medium">Practice Mode</div>
                              <div className="text-xs text-muted-foreground">Text-based with timer</div>
                            </CardContent>
                          </Card>
                          
                          <Card 
                            className={`cursor-pointer transition-all ${interviewMode === 'ai-audio' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setInterviewMode('ai-audio')}
                          >
                            <CardContent className="p-4 text-center">
                              <Mic className="w-8 h-8 mx-auto mb-2 text-green-500" />
                              <div className="font-medium">AI Audio Call</div>
                              <div className="text-xs text-muted-foreground">Voice-only interaction</div>
                            </CardContent>
                          </Card>
                          
                          <Card 
                            className={`cursor-pointer transition-all ${interviewMode === 'ai-video' ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setInterviewMode('ai-video')}
                          >
                            <CardContent className="p-4 text-center">
                              <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                              <div className="font-medium">AI Video Call</div>
                              <div className="text-xs text-muted-foreground">Full video + body language</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {selectedRole && difficulty && (
                        <Alert>
                          <Zap className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Interview Preview:</strong> You'll face {selectedRole && difficulty ? generateInterviewQuestions(selectedRole, difficulty).length : 8} questions 
                            in <strong>{interviewMode}</strong> mode. This includes 3 HR/behavioral questions and 5+ technical questions specific to {selectedRole} at {difficulty} level.
                            {interviewMode === 'practice' ? " Answers will be analyzed using real AI for detailed feedback." : 
                             interviewMode === 'ai-audio' ? " Features real-time speech recognition and AI voice interaction with answer analysis." :
                             " Features real-time speech recognition, AI voice interaction, and body language analysis."}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        onClick={startInterview} 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedRole || !difficulty}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start {interviewMode === 'ai-video' ? 'AI Video Call' : interviewMode === 'ai-audio' ? 'AI Audio Call' : 'Practice'} Interview
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🚀 Advanced Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-500" />
                          Real AI-powered answer analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-500" />
                          Role-specific technical questions
                        </li>
                        <li className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          3 HR + 5+ technical questions
                        </li>
                        <li className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-orange-500" />
                          Detailed performance metrics
                        </li>
                        <li className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Personalized improvement suggestions
                        </li>
                        <li className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-red-500" />
                          Real-time voice AI interviews with Deepgram
                        </li>
                        <li className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-green-500" />
                          Audio-only interviews for focused conversation
                        </li>
                        <li className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-500" />
                          Video interviews with body language analysis
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💡 Interview Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>• Use the STAR method for behavioral questions</li>
                        <li>• Provide specific examples from your experience</li>
                        <li>• Think out loud for technical problems</li>
                        <li>• Be concise but comprehensive in your answers</li>
                        <li>• Practice explaining complex concepts simply</li>
                        <li>• For AI Call modes: Speak clearly and at moderate pace</li>
                        <li>• For Video mode: Look at camera, maintain good posture</li>
                        <li>• For Audio mode: Focus on clear articulation and tone</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : currentSession.status === 'active' ? (
              // Active Interview Phase
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Video Call Mode */}
                  {interviewMode === 'ai-video' && (
                    <AIVideoInterview
                      selectedRole={selectedRole}
                      difficulty={difficulty}
                      onInterviewEnd={completeInterview}
                      onAnswerSubmitted={(answer, question) => {
                        // Handle answer submission from AI video interview
                        const timeSpent = 30; // Approximate time
                        const newAnswer = {
                          questionId: question.id,
                          question: question.question,
                          answer: answer,
                          score: 0, // Will be updated by the AI analysis
                          feedback: "Processing...",
                          timeSpent: timeSpent
                        };
                        
                        setCurrentSession(prev => prev ? {
                          ...prev,
                          answers: [...prev.answers, newAnswer]
                        } : null);
                      }}
                    />
                  )}

                  {/* AI Audio Call Mode */}
                  {interviewMode === 'ai-audio' && (
                    <AIAudioInterview
                      selectedRole={selectedRole}
                      difficulty={difficulty}
                      onInterviewEnd={completeInterview}
                      onAnswerSubmitted={(answer, question) => {
                        // Handle answer submission from AI audio interview
                        const timeSpent = 30; // Approximate time
                        const newAnswer = {
                          questionId: question.id,
                          question: question.question,
                          answer: answer,
                          score: 0, // Will be updated by the AI analysis
                          feedback: "Processing...",
                          timeSpent: timeSpent
                        };
                        
                        setCurrentSession(prev => prev ? {
                          ...prev,
                          answers: [...prev.answers, newAnswer]
                        } : null);
                      }}
                    />
                  )}

                  {/* Practice Mode - Chat Interface */}
                  {interviewMode === 'practice' && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={currentQuestion?.type === "technical" ? "default" : 
                                          currentQuestion?.type === "behavioral" ? "secondary" : "outline"}>
                              {currentQuestion?.type}
                            </Badge>
                            <Badge variant={currentQuestion?.difficulty === "hard" ? "destructive" : 
                                          currentQuestion?.difficulty === "medium" ? "default" : "secondary"}>
                              {currentQuestion?.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* AI Interviewer */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium mb-2 text-blue-900">AI Interviewer</div>
                            <div className="text-foreground font-medium text-lg leading-relaxed">
                              {currentQuestion?.question}
                            </div>
                            {currentQuestion?.followUp && showFeedback && (
                              <div className="mt-3 text-sm text-muted-foreground italic">
                                Follow-up: {currentQuestion.followUp}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timer (Practice Mode Only) */}
                        {interviewMode === 'practice' && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">Time Remaining:</span>
                            </div>
                            <div className={`text-lg font-bold ${timeLeft <= 30 ? 'text-destructive' : 'text-foreground'}`}>
                              {formatTime(timeLeft)}
                            </div>
                          </div>
                        )}

                        {/* Answer Input */}
                        {!showFeedback && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Your Answer:</label>
                              <Textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Type your answer here... Be specific and provide examples from your experience."
                                className="min-h-[120px]"
                                disabled={isAnalyzing}
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button 
                                onClick={submitAnswer} 
                                disabled={!currentAnswer.trim() || isAnalyzing}
                                className="flex-1"
                              >
                                {isAnalyzing ? (
                                  <>
                                    <Brain className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing Answer & Body Language...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit Answer
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" onClick={() => setCurrentAnswer("")}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Clear
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Feedback Display */}
                        {showFeedback && currentSession.answers.length > 0 && (
                          <div className="space-y-4">
                            {(() => {
                              const lastAnswer = currentSession.answers[currentSession.answers.length - 1];
                              const analysis = lastAnswer.analysisResult;
                              return (
                                <div className="p-4 border rounded-lg bg-muted/30">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <BarChart3 className="w-4 h-4" />
                                      AI Analysis Results
                                    </h4>
                                    <div className="flex items-center gap-4">
                                      <div className="text-center">
                                        <div className={`text-xl font-bold ${
                                          lastAnswer.score >= 80 ? 'text-green-600' : 
                                          lastAnswer.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {lastAnswer.score}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Overall</div>
                                      </div>
                                      {lastAnswer.bodyLanguageScore && (
                                        <div className="text-center">
                                          <div className={`text-xl font-bold ${
                                            lastAnswer.bodyLanguageScore >= 80 ? 'text-green-600' : 
                                            lastAnswer.bodyLanguageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                          }`}>
                                            {lastAnswer.bodyLanguageScore}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">Body Language</div>
                                        </div>
                                      )}
                                      {lastAnswer.score >= 80 && <Star className="w-5 h-5 text-yellow-500" />}
                                    </div>
                                  </div>
                                  
                                  {/* Detailed Analysis Scores */}
                                  {analysis && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                      <div className="text-center p-2 bg-blue-50 rounded">
                                        <div className="text-lg font-bold text-blue-600">{analysis.communicationScore}%</div>
                                        <div className="text-xs text-muted-foreground">Communication</div>
                                      </div>
                                      <div className="text-center p-2 bg-green-50 rounded">
                                        <div className="text-lg font-bold text-green-600">{analysis.completeness}%</div>
                                        <div className="text-xs text-muted-foreground">Completeness</div>
                                      </div>
                                      <div className="text-center p-2 bg-purple-50 rounded">
                                        <div className="text-lg font-bold text-purple-600">{analysis.clarity}%</div>
                                        <div className="text-xs text-muted-foreground">Clarity</div>
                                      </div>
                                      {analysis.technicalAccuracy > 0 && (
                                        <div className="text-center p-2 bg-orange-50 rounded">
                                          <div className="text-lg font-bold text-orange-600">{analysis.technicalAccuracy}%</div>
                                          <div className="text-xs text-muted-foreground">Technical</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <p className="text-sm text-muted-foreground mb-3">{lastAnswer.feedback}</p>
                                  
                                  {/* Strengths and Improvements */}
                                  {analysis && (
                                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                                      {analysis.strengths.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium text-green-700 mb-1">✅ Strengths:</h5>
                                          <ul className="text-xs text-muted-foreground space-y-1">
                                            {analysis.strengths.map((strength, index) => (
                                              <li key={index}>• {strength}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {analysis.improvements.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium text-orange-700 mb-1">💡 Improvements:</h5>
                                          <ul className="text-xs text-muted-foreground space-y-1">
                                            {analysis.improvements.map((improvement, index) => (
                                              <li key={index}>• {improvement}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Keywords Analysis */}
                                  {analysis && (analysis.keywordMatches.length > 0 || analysis.missingKeywords.length > 0) && (
                                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                                      {analysis.keywordMatches.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium text-green-700 mb-1">🎯 Keywords Used:</h5>
                                          <div className="flex flex-wrap gap-1">
                                            {analysis.keywordMatches.map((keyword, index) => (
                                              <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                {keyword}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {analysis.missingKeywords.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium text-orange-700 mb-1">📝 Consider Adding:</h5>
                                          <div className="flex flex-wrap gap-1">
                                            {analysis.missingKeywords.slice(0, 5).map((keyword, index) => (
                                              <Badge key={index} variant="outline" className="text-xs border-orange-300 text-orange-700">
                                                {keyword}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground">
                                    Response time: {lastAnswer.timeSpent}s | Question type: {currentQuestion?.category} - {currentQuestion?.type}
                                  </div>
                                </div>
                              );
                            })()}

                            <Button onClick={nextQuestion} className="w-full">
                              {currentSession.currentQuestionIndex < currentSession.questions.length - 1 ? (
                                <>Next Question →</>
                              ) : (
                                <>Complete Interview</>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Interview Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Enhanced Sidebar */}
                <div className="space-y-6">
                  {/* Session Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Session Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mode</span>
                        <Badge variant="outline">{interviewMode}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Questions Answered</span>
                        <span className="font-semibold">{currentSession.answers.length}/{currentSession.questions.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="font-semibold">
                          {currentSession.answers.length > 0 ? 
                            Math.round(currentSession.answers.reduce((sum, a) => sum + a.score, 0) / currentSession.answers.length) : 0}%
                        </span>
                      </div>
                      {currentSession.answers.some(a => a.bodyLanguageScore) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Body Language</span>
                          <span className="font-semibold">
                            {Math.round(currentSession.answers.filter(a => a.bodyLanguageScore).reduce((sum, a) => sum + (a.bodyLanguageScore || 0), 0) / 
                            currentSession.answers.filter(a => a.bodyLanguageScore).length)}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time Elapsed</span>
                        <span className="font-semibold">
                          {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000)} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Body Language Metrics */}
                  {bodyLanguageMetrics && interviewMode === 'ai-video' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Live Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Eye Contact
                          </span>
                          <span className="text-sm font-medium">{bodyLanguageMetrics.eyeContact}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Confidence</span>
                          <span className="text-sm font-medium">{bodyLanguageMetrics.confidence}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Engagement</span>
                          <span className="text-sm font-medium">{bodyLanguageMetrics.engagement}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Smile className="w-3 h-3" />
                          <Badge variant={
                            bodyLanguageMetrics.facialExpression === 'positive' ? 'default' :
                            bodyLanguageMetrics.facialExpression === 'negative' ? 'destructive' :
                            'secondary'
                          }>
                            {bodyLanguageMetrics.facialExpression}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" size="sm" className="w-full" onClick={resetInterview}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // Enhanced Completed Interview Phase
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-yellow-500" />
                      Interview Completed!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Enhanced Overall Score */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className={`text-5xl font-bold mb-2 ${
                          currentSession.overallScore >= 80 ? 'text-green-600' : 
                          currentSession.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {currentSession.overallScore}%
                        </div>
                        <div className="text-lg text-muted-foreground">Answer Quality</div>
                        <div className="mt-2">
                          {currentSession.overallScore >= 80 ? (
                            <Badge className="bg-green-500">Excellent</Badge>
                          ) : currentSession.overallScore >= 60 ? (
                            <Badge className="bg-yellow-500">Good</Badge>
                          ) : (
                            <Badge variant="destructive">Needs Work</Badge>
                          )}
                        </div>
                      </div>

                      {currentSession.bodyLanguageScore > 0 && (
                        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                          <div className={`text-5xl font-bold mb-2 ${
                            currentSession.bodyLanguageScore >= 80 ? 'text-green-600' : 
                            currentSession.bodyLanguageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {currentSession.bodyLanguageScore}%
                          </div>
                          <div className="text-lg text-muted-foreground">Body Language</div>
                          <div className="mt-2">
                            {currentSession.bodyLanguageScore >= 80 ? (
                              <Badge className="bg-green-500">Confident</Badge>
                            ) : currentSession.bodyLanguageScore >= 60 ? (
                              <Badge className="bg-yellow-500">Good Presence</Badge>
                            ) : (
                              <Badge variant="destructive">Work on Confidence</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Results */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Question Breakdown
                        </h3>
                        <div className="space-y-3">
                          {currentSession.answers.map((answer, index) => (
                            <div key={answer.questionId} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Question {index + 1}</span>
                                <div className="flex gap-2">
                                  <span className={`text-sm font-bold ${
                                    answer.score >= 80 ? 'text-green-600' : 
                                    answer.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {answer.score}%
                                  </span>
                                  {answer.bodyLanguageScore && (
                                    <span className={`text-xs font-medium ${
                                      answer.bodyLanguageScore >= 80 ? 'text-green-600' : 
                                      answer.bodyLanguageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      BL: {answer.bodyLanguageScore}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {answer.feedback.split('.')[0]}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Personalized Recommendations
                        </h3>
                        <div className="space-y-3 text-sm">
                          {currentSession.overallScore < 60 && (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Focus on providing more detailed answers with specific examples from your experience.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {currentSession.bodyLanguageScore > 0 && currentSession.bodyLanguageScore < 70 && (
                            <Alert>
                              <Eye className="h-4 w-4" />
                              <AlertDescription>
                                Work on maintaining eye contact and confident body language during interviews.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="font-medium mb-2">Next Steps:</div>
                            <ul className="space-y-1 text-muted-foreground">
                              <li>• Practice more {selectedRole} technical questions</li>
                              <li>• Work on the STAR method for behavioral questions</li>
                              <li>• Review {difficulty} level concepts for your role</li>
                              {currentSession.bodyLanguageScore > 0 && currentSession.bodyLanguageScore < 80 && (
                                <li>• Practice maintaining eye contact and confident posture</li>
                              )}
                              <li>• Try the AI Audio or Video modes for more realistic practice</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button onClick={resetInterview}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Take Another Interview
                      </Button>
                      <Button variant="outline">
                        <Award className="w-4 h-4 mr-2" />
                        View Detailed Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Interview Questions & Answers Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Role</label>
                    {userProfile?.targetRoles && userProfile.targetRoles.length > 0 ? (
                      <div className="text-xs text-muted-foreground mb-2">
                        Showing roles based on your profile: {userProfile.targetRoles.join(', ')}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mb-2">
                        Showing roles based on your resume analysis
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setShowRoleSelector(true)}
                    >
                      {selectedRole ? 
                        availableRoles.find(r => r.value === selectedRole)?.label || "Select role" : 
                        "Select role"
                      }
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Entry Level)</SelectItem>
                        <SelectItem value="medium">Medium (Mid Level)</SelectItem>
                        <SelectItem value="hard">Hard (Senior Level)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRole && difficulty && (
                  <Alert>
                    <BookOpen className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Export Preview:</strong> You'll get {interviewQuestionsService.getInterviewQuestionsWithAnswers(selectedRole, difficulty).questions.length} questions 
                      including 3 HR/behavioral questions and 5+ technical questions specific to {selectedRole} at {difficulty} level.
                      Each question includes a good answer example, key points, and interview tips.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => exportInterviewQuestions('text')} 
                    disabled={!selectedRole || !difficulty}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export as Text
                  </Button>
                  <Button 
                    onClick={() => exportInterviewQuestions('html')} 
                    disabled={!selectedRole || !difficulty}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export as HTML (PDF Ready)
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-3">📋 What's Included:</h3>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      3 HR/Behavioral questions with STAR method examples
                    </li>
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      5+ Technical questions specific to your selected role
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Good answer examples for each question
                    </li>
                    <li className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Key points and interview tips for better responses
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      HTML format can be printed as PDF from your browser
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {isLoadingHistory ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5 animate-spin" />
                    <span>Loading interview history...</span>
                  </div>
                </CardContent>
              </Card>
            ) : recentSessions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No interview history yet.</p>
                    <p className="text-sm">Complete your first interview to see results here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recentSessions.map((session, index) => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                            {session.mode === 'ai-video' ? (
                              <Brain className="w-6 h-6 text-purple-500" />
                            ) : session.mode === 'ai-audio' ? (
                              <Mic className="w-6 h-6 text-green-500" />
                            ) : (
                              <MessageSquare className="w-6 h-6 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.role}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(session.duration)}
                              </span>
                              <span>{session.totalQuestions} questions</span>
                              <span>{formatDate(session.createdAt)}</span>
                              <Badge variant="outline" className="text-xs">{session.mode}</Badge>
                              <Badge variant={
                                session.status === 'completed' ? 'default' : 
                                session.status === 'abandoned' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {session.status === 'completed' ? 'Completed' : 
                                 session.status === 'abandoned' ? `${session.completionPercentage}% Complete` : 
                                 'In Progress'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <div className="text-xs">
                                <span className="text-green-600">Questions Answered:</span> {session.answeredQuestions}/{session.totalQuestions}
                              </div>
                            </div>
                            {session.completionPercentage < 100 && (
                              <div className="flex gap-2">
                                <div className="text-xs">
                                  <span className="text-orange-600">Completion:</span> {session.completionPercentage}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4 mb-2">
                            {session.status === 'completed' && (
                              <>
                                <div className="text-center">
                                  <div className={`text-xl font-bold ${
                                    session.overallScore >= 80 ? "text-green-600" : 
                                    session.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                                  }`}>
                                    {session.overallScore}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">Answer</div>
                                </div>
                                {session.bodyLanguageScore > 0 && (
                                  <div className="text-center">
                                    <div className={`text-xl font-bold ${
                                      session.bodyLanguageScore >= 80 ? "text-green-600" : 
                                      session.bodyLanguageScore >= 60 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                      {session.bodyLanguageScore}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Body Lang.</div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedHistoryItem(session);
                              setShowHistoryDetails(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalInterviews}</div>
                        <div className="text-sm text-muted-foreground">Total Interviews</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.completedInterviews}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.averageScore}%</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analytics.averageCompletionRate}%</div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Role Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.roleBreakdown).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm">{role}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${((count as number) / analytics.totalInterviews) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.scoreDistribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm">{range}%</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${analytics.completedInterviews > 0 ? ((count as number) / analytics.completedInterviews) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6">
                      <div className={`text-3xl font-bold mb-2 ${
                        analytics.recentTrend > 0 ? 'text-green-600' : 
                        analytics.recentTrend < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {analytics.recentTrend > 0 ? '+' : ''}{analytics.recentTrend}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {analytics.recentTrend > 0 ? 'Improving' : 
                         analytics.recentTrend < 0 ? 'Declining' : 'Stable'} performance trend
                      </div>
                      <div className="mt-2">
                        {analytics.recentTrend > 0 ? (
                          <Badge className="bg-green-500">📈 Getting Better</Badge>
                        ) : analytics.recentTrend < 0 ? (
                          <Badge variant="destructive">📉 Needs Focus</Badge>
                        ) : (
                          <Badge variant="secondary">➡️ Consistent</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {analytics.averageBodyLanguageScore > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Body Language Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Eye className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <div className="text-2xl font-bold text-blue-600">{analytics.averageBodyLanguageScore}%</div>
                          <div className="text-sm text-muted-foreground">Avg Body Language</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Smile className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <div className="text-2xl font-bold text-green-600">85%</div>
                          <div className="text-sm text-muted-foreground">Positive Expression</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                          <div className="text-2xl font-bold text-purple-600">68%</div>
                          <div className="text-sm text-muted-foreground">Good Posture</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                          <div className="text-2xl font-bold text-orange-600">78%</div>
                          <div className="text-sm text-muted-foreground">Confidence Level</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No analytics data available yet.</p>
                    <p className="text-sm">Complete more interviews to see detailed analytics.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </main>
      </div>

      {/* Interview History Details Modal */}
      <Dialog open={showHistoryDetails} onOpenChange={setShowHistoryDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          
          {selectedHistoryItem && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interview Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">{selectedHistoryItem.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium">{selectedHistoryItem.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode:</span>
                      <Badge variant="outline">{selectedHistoryItem.mode}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={
                        selectedHistoryItem.status === 'completed' ? 'default' : 
                        selectedHistoryItem.status === 'abandoned' ? 'destructive' : 'secondary'
                      }>
                        {selectedHistoryItem.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{formatDuration(selectedHistoryItem.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{formatDate(selectedHistoryItem.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedHistoryItem.status === 'completed' && (
                      <>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className={`text-3xl font-bold ${
                            selectedHistoryItem.overallScore >= 80 ? 'text-green-600' : 
                            selectedHistoryItem.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedHistoryItem.overallScore}%
                          </div>
                          <div className="text-sm text-muted-foreground">Overall Score</div>
                        </div>
                        
                        {selectedHistoryItem.bodyLanguageScore > 0 && (
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className={`text-3xl font-bold ${
                              selectedHistoryItem.bodyLanguageScore >= 80 ? 'text-green-600' : 
                              selectedHistoryItem.bodyLanguageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {selectedHistoryItem.bodyLanguageScore}%
                            </div>
                            <div className="text-sm text-muted-foreground">Body Language</div>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Questions Answered:</span>
                      <span className="font-medium">{selectedHistoryItem.answeredQuestions}/{selectedHistoryItem.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion:</span>
                      <span className="font-medium">{selectedHistoryItem.completionPercentage}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Questions and Answers */}
              {selectedHistoryItem.answers && selectedHistoryItem.answers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Questions & Answers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedHistoryItem.answers.map((answer, index) => (
                        <div key={answer.questionId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline">{answer.timeSpent}s</Badge>
                              <Badge variant={
                                answer.score >= 80 ? 'default' : 
                                answer.score >= 60 ? 'secondary' : 'destructive'
                              }>
                                {answer.score}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Question:</div>
                              <div className="text-sm">{answer.question}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</div>
                              <div className="text-sm bg-muted/50 p-3 rounded">{answer.answer}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Feedback:</div>
                              <div className="text-sm text-muted-foreground">{answer.feedback}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Selector Dialog */}
      <Dialog open={showRoleSelector} onOpenChange={setShowRoleSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Interview Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search roles by name, category, or description..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Role Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filteredRoles.length}</div>
                <div className="text-sm text-muted-foreground">Available Roles</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Object.keys(rolesByCategory).length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {userProfile?.targetRoles ? userProfile.targetRoles.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Your Target Roles</div>
              </div>
            </div>

            {/* Roles Table by Category */}
            <div className="space-y-6">
              {Object.entries(rolesByCategory).map(([category, roles]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline">{category}</Badge>
                    <span className="text-sm text-muted-foreground">({roles.length} roles)</span>
                  </h3>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Role</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow 
                            key={role.value}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              selectedRole === role.value ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleRoleSelect(role.value)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {role.label}
                                {userProfile?.targetRoles?.some(tr => 
                                  tr.toLowerCase().includes(role.label.toLowerCase()) ||
                                  role.label.toLowerCase().includes(tr.toLowerCase())
                                ) && (
                                  <Badge variant="secondary" className="text-xs">
                                    Target
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {role.description}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={selectedRole === role.value ? "default" : "outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoleSelect(role.value);
                                }}
                              >
                                {selectedRole === role.value ? "Selected" : "Select"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>

            {filteredRoles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No roles found matching your search.</p>
                <p className="text-sm">Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MockInterview;