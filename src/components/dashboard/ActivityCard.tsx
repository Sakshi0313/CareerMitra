import { Activity, FileText, Mic, BookOpen, Target, Clock, Brain, TrendingUp, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { useEffect, useState } from "react";

interface ActivityItem {
  icon: any;
  title: string;
  description: string;
  time: string;
  color: string;
}

const ActivityCard = () => {
  const { userProfile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  useEffect(() => {
    const loadRecentActivities = () => {
      const recentActivities: ActivityItem[] = [];
      
      try {
        // Load interview activities
        const interviewResults = JSON.parse(localStorage.getItem('interviewResults') || '[]');
        if (interviewResults.length > 0) {
          const lastInterview = interviewResults[interviewResults.length - 1];
          const timeAgo = getTimeAgo(new Date(lastInterview.timestamp));
          
          recentActivities.push({
            icon: lastInterview.type === 'video' ? Mic : Mic,
            title: `${lastInterview.type === 'video' ? 'Video' : 'Audio'} Interview Completed`,
            description: `${lastInterview.role} interview - Scored ${lastInterview.averageScore}%`,
            time: timeAgo,
            color: lastInterview.averageScore >= 80 ? "bg-green-100 text-green-600" : 
                   lastInterview.averageScore >= 60 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600",
          });
        }
        
        // Load ATS analysis activity
        const atsData = localStorage.getItem('atsAnalysisResult');
        if (atsData) {
          try {
            const parsedAts = JSON.parse(atsData);
            const atsScore = parsedAts.overallScore || parsedAts.score || 0;
            
            recentActivities.push({
              icon: Brain,
              title: "Resume ATS Analysis",
              description: `Resume analyzed - ATS Score: ${atsScore}%`,
              time: "Recently",
              color: atsScore >= 80 ? "bg-green-100 text-green-600" : 
                     atsScore >= 60 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600",
            });
          } catch (e) {
            console.warn('Failed to parse ATS data for activity:', e);
          }
        }
        
        // Add profile completion activities
        if (userProfile) {
          const skillsCount = userProfile.skills?.length || 0;
          if (skillsCount > 0) {
            recentActivities.push({
              icon: Target,
              title: "Skills Updated",
              description: `Added ${skillsCount} skill${skillsCount !== 1 ? 's' : ''} to profile`,
              time: "Recently",
              color: "bg-blue-100 text-blue-600",
            });
          }
          
          if (userProfile.bio) {
            recentActivities.push({
              icon: FileText,
              title: "Profile Bio Added",
              description: "Professional bio added to profile",
              time: "Recently",
              color: "bg-purple-100 text-purple-600",
            });
          }
        }
        
        // Add welcome activity if no other activities
        if (recentActivities.length === 0 && userProfile) {
          recentActivities.push({
            icon: CheckCircle,
            title: "Account created",
            description: `Welcome to CareerMitra, ${userProfile.displayName?.split(' ')[0]}!`,
            time: "Recently",
            color: "bg-secondary/10 text-secondary",
          });
          
          recentActivities.push({
            icon: Target,
            title: "Get Started",
            description: "Complete your profile and take your first interview",
            time: "Now",
            color: "bg-primary/10 text-primary",
          });
        }
        
        // Sort by most recent and limit to 4 activities
        setActivities(recentActivities.slice(0, 4));
        
      } catch (error) {
        console.error('Failed to load activities:', error);
        
        // Fallback activities
        if (userProfile) {
          setActivities([
            {
              icon: CheckCircle,
              title: "Account created",
              description: `Welcome to CareerMitra, ${userProfile.displayName?.split(' ')[0]}!`,
              time: "Recently",
              color: "bg-secondary/10 text-secondary",
            },
            {
              icon: Target,
              title: "Profile setup",
              description: "Complete your profile to get started",
              time: "Now",
              color: "bg-primary/10 text-primary",
            },
          ]);
        }
      }
    };
    
    loadRecentActivities();
    
    // Refresh activities every 30 seconds
    const interval = setInterval(loadRecentActivities, 30000);
    return () => clearInterval(interval);
  }, [userProfile]);
  
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Activity className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Your latest actions</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">No Activity Yet</h4>
          <p className="text-sm text-muted-foreground">
            Start using CareerMitra to see your activity here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <Activity className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Real-time updates</p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center flex-shrink-0`}>
              <activity.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">{activity.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates enabled</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
