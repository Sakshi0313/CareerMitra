import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import ResumeScoreCard from "@/components/dashboard/ResumeScoreCard";
import RoadmapCard from "@/components/dashboard/RoadmapCard";
import InterviewPrepCard from "@/components/dashboard/InterviewPrepCard";
import SkillsCard from "@/components/dashboard/SkillsCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import ActivityCard from "@/components/dashboard/ActivityCard";
import { FileText, Mic, Target, TrendingUp, Loader2 } from "lucide-react";

interface UserStats {
  atsScore: number;
  mockInterviews: number;
  skillsCount: number;
  roadmapProgress: number;
  profileCompleteness: number;
}

const Dashboard = () => {
  const { userProfile, currentUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    atsScore: 0,
    mockInterviews: 0,
    skillsCount: 0,
    roadmapProgress: 0,
    profileCompleteness: 0
  });
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && currentUser) {
      loadUserStats();
    }
  }, [currentUser, authLoading]);

  // Refresh data when user comes back to dashboard (e.g., from ATS Analyzer)
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        loadUserStats();
      }
    };

    const handleRoadmapUpdate = () => {
      if (currentUser) {
        loadUserStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('roadmapUpdated', handleRoadmapUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('roadmapUpdated', handleRoadmapUpdate);
    };
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Load user stats from Firebase
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Load user stats
      const userStatsDoc = await getDoc(doc(db, 'userStats', currentUser.uid));
      
      // Load roadmap data
      const roadmapDoc = await getDoc(doc(db, 'roadmaps', currentUser.uid));
      if (roadmapDoc.exists()) {
        const roadmapData = roadmapDoc.data();
        setRoadmapData(roadmapData);
        
        // Update stats with real ATS score from roadmap
        if (roadmapData.resumeScore) {
          const updatedStats = {
            atsScore: roadmapData.resumeScore,
            mockInterviews: 0,
            skillsCount: roadmapData.extractedSkills?.length || 0,
            roadmapProgress: 0,
            profileCompleteness: calculateProfileCompleteness()
          };
          setStats(updatedStats);
          
          // Save updated stats to Firebase
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'userStats', currentUser.uid), updatedStats);
          return; // Skip loading old stats if we have roadmap data
        }
      }
      
      if (userStatsDoc.exists()) {
        const statsData = userStatsDoc.data() as UserStats;
        setStats(statsData);
      } else {
        // Initialize default stats for new users
        const defaultStats = {
          atsScore: 0,
          mockInterviews: 0,
          skillsCount: 0,
          roadmapProgress: 0,
          profileCompleteness: calculateProfileCompleteness()
        };
        setStats(defaultStats);
        
        // Save default stats to Firebase
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'userStats', currentUser.uid), defaultStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default stats on error to prevent crashes
      setStats({
        atsScore: 0,
        mockInterviews: 0,
        skillsCount: 0,
        roadmapProgress: 0,
        profileCompleteness: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = () => {
    if (!userProfile) return 0;
    
    let completeness = 0;
    const fields = ['displayName', 'email'];
    
    fields.forEach(field => {
      if (userProfile[field as keyof typeof userProfile]) {
        completeness += 50; // Each field is worth 50%
      }
    });
    
    return Math.min(completeness, 100);
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

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your career progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="ATS Score"
              value={stats.atsScore > 0 ? `${stats.atsScore}%` : "Not analyzed"}
              subtitle={stats.atsScore > 0 ? "Last updated recently" : "Upload resume to analyze"}
              icon={FileText}
              trend={stats.atsScore > 0 ? { value: 12, positive: true } : undefined}
              variant={stats.atsScore > 70 ? "success" : stats.atsScore > 0 ? "warning" : "default"}
            />
            <StatsCard 
              title="Mock Interviews"
              value={stats.mockInterviews.toString()}
              subtitle={stats.mockInterviews > 0 ? `${Math.min(stats.mockInterviews, 3)} this week` : "Start practicing"}
              icon={Mic}
              trend={stats.mockInterviews > 0 ? { value: 25, positive: true } : undefined}
              variant="warning"
            />
            <StatsCard 
              title="Skills Added"
              value={stats.skillsCount.toString()}
              subtitle={stats.skillsCount > 0 ? `${Math.min(stats.skillsCount, 5)} in-demand skills` : "Add your skills"}
              icon={Target}
              variant="default"
            />
            <StatsCard 
              title="Roadmap Progress"
              value={stats.roadmapProgress > 0 ? `${stats.roadmapProgress}%` : "Not started"}
              subtitle={stats.roadmapProgress > 0 ? "Keep going!" : "Choose your path"}
              icon={TrendingUp}
              trend={stats.roadmapProgress > 0 ? { value: 8, positive: true } : undefined}
              variant="default"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActionsCard />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <ResumeScoreCard atsScore={stats.atsScore} roadmapData={roadmapData} />
            <RoadmapCard progress={stats.roadmapProgress} roadmapData={roadmapData} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <InterviewPrepCard interviewCount={stats.mockInterviews} />
            <SkillsCard skillsCount={stats.skillsCount} />
          </div>

          {/* Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ActivityCard />
            
            {/* Recruiter Visibility Card */}
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6 text-foreground relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-display font-semibold text-xl mb-2">Get Discovered by Recruiters</h3>
                <p className="text-muted-foreground mb-6">
                  Complete your profile to increase visibility to 500+ verified recruiters looking for talent like you.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Profile Completeness</span>
                      <span className="text-sm font-semibold">{stats.profileCompleteness}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all duration-500" 
                        style={{ width: `${stats.profileCompleteness}%` }}
                      />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
                    Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;