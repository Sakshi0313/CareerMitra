import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import ResumeScoreCard from "@/components/dashboard/ResumeScoreCard";
import RoadmapCard from "@/components/dashboard/RoadmapCard";
import InterviewPrepCard from "@/components/dashboard/InterviewPrepCard";
import SkillsCard from "@/components/dashboard/SkillsCard";
import ActivityCard from "@/components/dashboard/ActivityCard";
import StudentMessages from "@/components/dashboard/StudentMessages";
import { FileText, Mic, Target, TrendingUp, Loader2, Trophy, Clock, BarChart3, Zap, MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  realtimeDataService, 
  type UserStats, 
  type InterviewResult, 
  type ATSAnalysis, 
  type RoadmapProgress,
  type UserActivity 
} from "@/lib/realtimeDataService";
import { dataMigrationService } from "@/lib/dataMigration";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const { userProfile, currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<UserStats>({
    atsScore: 0,
    mockInterviews: 0,
    skillsCount: 0,
    roadmapProgress: 0,
    profileCompleteness: 0,
    lastInterviewScore: 0,
    totalInterviewTime: 0,
    averageScore: 0,
    improvementTrend: 0,
    lastUpdated: new Date()
  });
  const [recentInterviews, setRecentInterviews] = useState<InterviewResult[]>([]);
  const [atsAnalyses, setAtsAnalyses] = useState<ATSAnalysis[]>([]);
  const [roadmapData, setRoadmapData] = useState<RoadmapProgress | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  console.log('Dashboard render:', { userProfile: !!userProfile, currentUser: !!currentUser, authLoading });

  // Set up real-time Firebase listeners
  useEffect(() => {
    if (!currentUser?.uid || authLoading) return;

    console.log('Setting up real-time listeners for user:', currentUser.uid);
    setLoading(true);

    const unsubscribers: (() => void)[] = [];

    try {
      // Subscribe to user stats
      const unsubStats = realtimeDataService.subscribeToUserStats(
        currentUser.uid,
        (newStats) => {
          console.log('Received real-time stats update:', newStats);
          setStats(newStats);
          setIsRealTimeConnected(true);
          setLoading(false);
        }
      );
      unsubscribers.push(unsubStats);

      // Subscribe to interview results
      const unsubInterviews = realtimeDataService.subscribeToInterviewResults(
        currentUser.uid,
        (interviews) => {
          console.log('Received real-time interviews update:', interviews.length, 'interviews');
          setRecentInterviews(interviews);
        }
      );
      unsubscribers.push(unsubInterviews);

      // Subscribe to ATS analyses
      const unsubATS = realtimeDataService.subscribeToATSAnalyses(
        currentUser.uid,
        (analyses) => {
          console.log('Received real-time ATS analyses update:', analyses.length, 'analyses');
          setAtsAnalyses(analyses);
        }
      );
      unsubscribers.push(unsubATS);

      // Subscribe to roadmap progress
      const unsubRoadmap = realtimeDataService.subscribeToRoadmapProgress(
        currentUser.uid,
        (roadmap) => {
          console.log('Received real-time roadmap update:', roadmap);
          setRoadmapData(roadmap);
        }
      );
      unsubscribers.push(unsubRoadmap);

      // Subscribe to user activities
      const unsubActivities = realtimeDataService.subscribeToUserActivities(
        currentUser.uid,
        (activities) => {
          console.log('Received real-time activities update:', activities.length, 'activities');
          setUserActivities(activities);
        }
      );
      unsubscribers.push(unsubActivities);

      // Calculate and update profile completeness
      if (userProfile) {
        const completeness = realtimeDataService.calculateProfileCompleteness(userProfile);
        realtimeDataService.updateUserStats(currentUser.uid, {
          profileCompleteness: completeness,
          skillsCount: userProfile.skills?.length || 0
        }).catch(console.error);
      }

      // Set connection timeout - if no data received in 5 seconds, use fallback
      const connectionTimeout = setTimeout(() => {
        if (!isRealTimeConnected) {
          console.log('Real-time connection timeout, checking for fallback data');
          setIsRealTimeConnected(false);
          setLoading(false);
          
          // Only load fallback if there's actual meaningful offline data
          const interviewResults = JSON.parse(localStorage.getItem('interviewResults') || '[]') as any[];
          const atsDataKey = userProfile?.uid ? `ats_analysis_${userProfile.uid}` : 'atsAnalysisResult';
          const atsData = localStorage.getItem(atsDataKey) || localStorage.getItem('atsAnalysisResult');
          
          const hasInterviewData = interviewResults.length > 0 && interviewResults.some(interview => 
            interview && typeof interview === 'object' && interview.averageScore !== undefined
          );
          
          let hasAtsData = false;
          if (atsData) {
            try {
              const parsedAts = JSON.parse(atsData);
              hasAtsData = parsedAts && (parsedAts.overallScore > 0 || parsedAts.score > 0 || parsedAts.atsScore > 0);
            } catch (e) {
              hasAtsData = false;
            }
          }
          
          if (hasInterviewData || hasAtsData) {
            loadFallbackData();
          } else {
            console.log('No meaningful offline data available, using empty state');
          }
        }
      }, 5000);

      // Cleanup timeout when component unmounts or connection succeeds
      const originalCleanup = () => {
        clearTimeout(connectionTimeout);
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };

      return originalCleanup;

    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      setLoading(false);
      setIsRealTimeConnected(false);
      
      // Only show fallback data if it actually exists and is meaningful
      const interviewResults = JSON.parse(localStorage.getItem('interviewResults') || '[]') as any[];
      const atsDataKey = userProfile?.uid ? `ats_analysis_${userProfile.uid}` : 'atsAnalysisResult';
      const atsData = localStorage.getItem(atsDataKey) || localStorage.getItem('atsAnalysisResult');
      
      const hasInterviewData = interviewResults.length > 0 && interviewResults.some(interview => 
        interview && typeof interview === 'object' && interview.averageScore !== undefined
      );
      
      let hasAtsData = false;
      if (atsData) {
        try {
          const parsedAts = JSON.parse(atsData);
          hasAtsData = parsedAts && (parsedAts.overallScore > 0 || parsedAts.score > 0 || parsedAts.atsScore > 0);
        } catch (e) {
          hasAtsData = false;
        }
      }
      
      if (hasInterviewData || hasAtsData) {
        loadFallbackData();
        toast.error('Failed to connect to real-time data. Using offline data.');
      } else {
        toast.error('Failed to connect to real-time data. Please check your internet connection.');
      }
    }
  }, [currentUser?.uid, authLoading, userProfile]);

  // Fallback to localStorage data if Firebase data is not available
  useEffect(() => {
    if (!isRealTimeConnected && !authLoading && currentUser?.uid && !loading) {
      console.log('Loading fallback data from localStorage');
      loadFallbackData();
    }
  }, [isRealTimeConnected, authLoading, currentUser?.uid, loading]);

  const loadFallbackData = () => {
    try {
      // Check if there's actually any offline data before proceeding
      const interviewResults = JSON.parse(localStorage.getItem('interviewResults') || '[]') as any[];
      const atsDataKey = userProfile?.uid ? `ats_analysis_${userProfile.uid}` : 'atsAnalysisResult';
      const atsData = localStorage.getItem(atsDataKey) || localStorage.getItem('atsAnalysisResult');
      
      // More thorough check for meaningful offline data
      const hasInterviewData = interviewResults.length > 0 && interviewResults.some(interview => 
        interview && typeof interview === 'object' && interview.averageScore !== undefined
      );
      
      let hasAtsData = false;
      if (atsData) {
        try {
          const parsedAts = JSON.parse(atsData);
          hasAtsData = parsedAts && (parsedAts.overallScore > 0 || parsedAts.score > 0 || parsedAts.atsScore > 0);
        } catch (e) {
          hasAtsData = false;
        }
      }
      
      // If no meaningful offline data exists, don't show offline message and use empty state
      if (!hasInterviewData && !hasAtsData) {
        console.log('No meaningful offline data found, using empty state');
        setLoading(false);
        return;
      }

      console.log('Loading actual offline data...', { hasInterviewData, hasAtsData });
      
      const formattedInterviews = interviewResults.map(interview => ({
        ...interview,
        id: interview.id || Date.now().toString(),
        userId: currentUser?.uid || '',
        timestamp: new Date(interview.timestamp)
      }));
      setRecentInterviews(formattedInterviews.slice(-5));
      
      let atsScore = 0;
      if (atsData) {
        try {
          const parsedAts = JSON.parse(atsData);
          atsScore = parsedAts.overallScore || parsedAts.score || parsedAts.atsScore || 0;
          
          // Convert to ATSAnalysis format
          const atsAnalysis: ATSAnalysis = {
            id: 'fallback',
            userId: currentUser?.uid || '',
            overallScore: atsScore,
            skillsMatch: parsedAts.skillsMatch || 0,
            experienceMatch: parsedAts.experienceMatch || 0,
            educationMatch: parsedAts.educationMatch || 0,
            keywordsFound: parsedAts.keywordsFound || [],
            missingKeywords: parsedAts.missingKeywords || [],
            suggestions: parsedAts.suggestions || [],
            jobTitle: parsedAts.jobTitle || 'Unknown',
            timestamp: new Date()
          };
          setAtsAnalyses([atsAnalysis]);
        } catch (e) {
          console.warn('Failed to parse ATS data:', e);
        }
      }
      
      // Calculate stats from fallback data
      const totalInterviews = formattedInterviews.length;
      const totalTime = formattedInterviews.reduce((sum, interview) => sum + (interview.duration || 0), 0);
      const totalScores = formattedInterviews.reduce((sum, interview) => sum + (interview.averageScore || 0), 0);
      const averageScore = totalInterviews > 0 ? Math.round(totalScores / totalInterviews) : 0;
      const lastScore = formattedInterviews.length > 0 ? formattedInterviews[formattedInterviews.length - 1]?.averageScore || 0 : 0;
      
      const profileCompleteness = userProfile ? realtimeDataService.calculateProfileCompleteness(userProfile) : 0;
      
      setStats({
        atsScore,
        mockInterviews: totalInterviews,
        skillsCount: userProfile?.skills?.length || 0,
        roadmapProgress: atsScore > 0 ? Math.min(atsScore + 20, 100) : 0,
        profileCompleteness,
        lastInterviewScore: lastScore,
        totalInterviewTime: Math.round(totalTime / 60),
        averageScore,
        improvementTrend: 0,
        lastUpdated: new Date()
      });
      
      setLoading(false);
      
      // Only show offline message if we actually loaded meaningful data
      if (hasInterviewData || hasAtsData) {
        console.log('Showing offline data message - found meaningful data:', { hasInterviewData, hasAtsData });
        toast.info('Using offline data. Connect to internet for real-time updates.');
      }
      
    } catch (error) {
      console.error('Failed to load fallback data:', error);
      setLoading(false);
    }
  };

  const handleMigrateData = async () => {
    if (!currentUser?.uid) return;
    
    setIsMigrating(true);
    try {
      toast.info('Migrating your data to real-time storage...');
      await dataMigrationService.migrateAllUserData(currentUser.uid);
      toast.success('Data migration completed! Your dashboard now shows real-time data.');
      setShowMigrationPrompt(false);
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to migrate data. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismissMigration = () => {
    setShowMigrationPrompt(false);
    toast.info('You can migrate your data later from the settings.');
  };

  const handleRefreshData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      toast.info('Refreshing real-time data...');
      
      // Force recalculate profile completeness
      if (userProfile) {
        const completeness = realtimeDataService.calculateProfileCompleteness(userProfile);
        await realtimeDataService.updateUserStats(currentUser.uid, {
          profileCompleteness: completeness,
          skillsCount: userProfile.skills?.length || 0
        });
      }
      
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No User Profile</h2>
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          {/* Data Migration Prompt */}
          {showMigrationPrompt && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>Upgrade to Real-time Data!</strong>
                  <p className="text-sm mt-1">
                    We found your interview results and ATS analysis in local storage. 
                    Migrate them to our new real-time system for better performance and cross-device sync.
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button 
                    size="sm" 
                    onClick={handleMigrateData}
                    disabled={isMigrating}
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      'Migrate Data'
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDismissMigration}
                    disabled={isMigrating}
                  >
                    Later
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Recruiter Messages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="mb-8">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Welcome back, {firstName}! 👋
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Here's your real-time career progress and performance analytics
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant={isRealTimeConnected ? "default" : "secondary"} className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {isRealTimeConnected ? 'Live Data' : 'Offline Data'}
                    </Badge>
                    <span className="text-muted-foreground">
                      Last updated: {stats.lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshData}
                      className="h-6 px-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
            
          {/* Real-time Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* ATS Score */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stats.atsScore > 0 ? 
                    stats.atsScore >= 80 ? 'text-green-600' : 
                    stats.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600' 
                    : 'text-muted-foreground'}`}>
                    {stats.atsScore > 0 ? `${stats.atsScore}%` : 'Not analyzed'}
                  </div>
                  <div className="text-sm text-muted-foreground">ATS Score</div>
                </div>
              </div>
              {stats.atsScore > 0 && (
                <Progress value={stats.atsScore} className="h-2" />
              )}
            </div>
            
            {/* Mock Interviews */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.mockInterviews}</div>
                  <div className="text-sm text-muted-foreground">Mock Interviews</div>
                </div>
              </div>
              {stats.averageScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Avg Score:</span>
                  <span className={`text-sm font-semibold ${
                    stats.averageScore >= 80 ? 'text-green-600' : 
                    stats.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.averageScore}%
                  </span>
                  {stats.improvementTrend !== 0 && (
                    <Badge variant={stats.improvementTrend > 0 ? "default" : "destructive"} className="text-xs">
                      {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {/* Skills */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.skillsCount}</div>
                  <div className="text-sm text-muted-foreground">Skills Added</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.skillsCount < 5 ? 'Add more skills to improve visibility' : 'Great skill diversity!'}
              </div>
            </div>
            
            {/* Practice Time */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalInterviewTime}</div>
                  <div className="text-sm text-muted-foreground">Minutes Practiced</div>
                </div>
              </div>
              {stats.lastInterviewScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Last Score:</span>
                  <span className={`text-sm font-semibold ${
                    stats.lastInterviewScore >= 80 ? 'text-green-600' : 
                    stats.lastInterviewScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.lastInterviewScore}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Interview Performance */}
          {recentInterviews.length > 0 && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Recent Interview Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentInterviews.slice(-3).map((interview, index) => (
                      <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {interview.type === 'video' ? '📹' : '🎤'} {interview.role}
                          </Badge>
                          <span className={`text-sm font-semibold ${
                            interview.averageScore >= 80 ? 'text-green-600' : 
                            interview.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {interview.averageScore}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {interview.questionsAnswered}/{interview.totalQuestions} questions • {Math.round(interview.duration / 60)}min
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {interview.timestamp.toLocaleDateString()}
                        </div>
                        <Progress value={interview.averageScore} className="h-1 mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="mb-8">
            <QuickActionsCard />
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <ResumeScoreCard atsScore={stats.atsScore} roadmapData={atsAnalyses[0] || roadmapData} />
            <RoadmapCard progress={stats.roadmapProgress} roadmapData={roadmapData} />
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <InterviewPrepCard interviewCount={stats.mockInterviews} />
            <SkillsCard skillsCount={stats.skillsCount} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ActivityCard />
            
            {/* Enhanced Profile Completeness */}
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6 text-foreground relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-display font-semibold text-xl mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Get Discovered by Recruiters
                </h3>
                <p className="text-muted-foreground mb-6">
                  Complete your profile to increase visibility to 500+ verified recruiters looking for talent like you.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Profile Completeness</span>
                      <span className="text-sm font-semibold">
                        {stats.profileCompleteness}%
                      </span>
                    </div>
                    <Progress value={stats.profileCompleteness} className="h-2 mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {stats.profileCompleteness < 50 ? 'Add more details to boost visibility' :
                       stats.profileCompleteness < 80 ? 'Almost there! Add projects and experience' :
                       'Excellent! Your profile is highly visible'}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
                    Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <StudentMessages activeTab="inbox" />
          </TabsContent>
        </Tabs>
      </div>
      </main>
    </div>
    </div>
  );
};

export default Dashboard;