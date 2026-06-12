import { TrendingUp, ChevronRight, CheckCircle, Circle, MapPin, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface RoadmapCardProps {
  progress: number;
  roadmapData?: any; // AI-generated roadmap data
}

const RoadmapCard = ({ progress, roadmapData }: RoadmapCardProps) => {
  // If we have AI roadmap data, show that instead of mock data
  if (roadmapData) {
    const totalSkillGaps = Object.values(roadmapData.skillGaps || {}).flat().length;
    const totalCourses = Object.values(roadmapData.learningPaths || {}).flat().length;
    const completedItems = Object.values(roadmapData.progress || {}).filter((p: any) => p.status === 'completed').length;
    const totalItems = Object.keys(roadmapData.progress || {}).length;
    const aiProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Calculate role-wise progress
    const roleProgress = roadmapData.targetRoles?.map((role: string) => {
      const roleKey = role.toLowerCase().replace(/\s+/g, '');
      const roleItems = Object.entries(roadmapData.progress || {})
        .filter(([itemId]) => {
          const itemIdLower = itemId.toLowerCase();
          const roleLower = role.toLowerCase();
          return itemIdLower.includes(roleLower) || 
                 itemIdLower.includes(roleKey) ||
                 itemId.startsWith(role) ||
                 itemId.startsWith(roleKey) ||
                 itemId.startsWith(`${role}_`) ||
                 itemId.startsWith(`${roleKey}_`) ||
                 itemIdLower.includes(`${roleKey}_skill_`) ||
                 itemIdLower.includes(`${roleLower.replace(/\s+/g, ' ')}_skill_`);
        });
      const roleCompleted = roleItems.filter(([, progress]: any) => progress.status === 'completed').length;
      const roleTotal = roleItems.length;
      const rolePercentage = roleTotal > 0 ? (roleCompleted / roleTotal) * 100 : 0;
      
      return {
        role,
        completed: roleCompleted,
        total: roleTotal,
        percentage: rolePercentage,
        skillGaps: roadmapData.skillGaps?.[role]?.length || 0
      };
    }) || [];

    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                AI Career Roadmap
                <Badge variant="default" className="text-xs">GPT-4.1</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">Best match: {roadmapData.bestMatchRole}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-secondary" asChild>
            <Link to="/dashboard/roadmap">
              View Full Roadmap
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* AI Roadmap Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{roadmapData.resumeScore}%</div>
            <div className="text-xs text-muted-foreground">ATS Score</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{totalSkillGaps}</div>
            <div className="text-xs text-muted-foreground">Skills to Learn</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{totalCourses}</div>
            <div className="text-xs text-muted-foreground">Courses Added</div>
          </div>
        </div>

        {/* Role-wise Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progress by Target Role
          </h4>
          {roleProgress.slice(0, 3).map((roleData, index) => (
            <div key={roleData.role} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{roleData.role}</span>
                <div className="flex items-center gap-2">
                  {roleData.skillGaps > 0 && (
                    <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                      {roleData.skillGaps} gaps
                    </Badge>
                  )}
                  <Badge variant={roleData.percentage >= 80 ? "default" : roleData.percentage >= 50 ? "secondary" : "outline"} className="text-xs">
                    {Math.round(roleData.percentage)}%
                  </Badge>
                </div>
              </div>
              {roleData.total > 0 && (
                <div className="space-y-1">
                  <Progress value={roleData.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{roleData.completed}/{roleData.total} completed</span>
                    <span>{roleData.total - roleData.completed} remaining</span>
                  </div>
                </div>
              )}
              {roleData.total === 0 && (
                <p className="text-xs text-muted-foreground">No learning items yet</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const milestones = [
    { title: "Complete React Fundamentals", status: progress >= 25 ? "completed" : "upcoming", progress: Math.min(progress * 4, 100) },
    { title: "Learn Node.js Basics", status: progress >= 50 ? "completed" : progress >= 25 ? "in-progress" : "upcoming", progress: Math.max(0, Math.min((progress - 25) * 4, 100)) },
    { title: "Master TypeScript", status: progress >= 75 ? "completed" : progress >= 50 ? "in-progress" : "upcoming", progress: Math.max(0, Math.min((progress - 50) * 4, 100)) },
    { title: "Build Portfolio Projects", status: progress >= 100 ? "completed" : progress >= 75 ? "in-progress" : "upcoming", progress: Math.max(0, Math.min((progress - 75) * 4, 100)) },
  ];

  if (progress === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Career Roadmap</h3>
              <p className="text-sm text-muted-foreground">Get AI-powered learning path</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">No AI Roadmap Yet</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your resume to get a personalized learning roadmap generated by GPT-4.1 based on your skills and target roles.
          </p>
          <Button asChild>
            <Link to="/ats-analyzer">
              <Brain className="w-4 h-4 mr-2" />
              Analyze Resume
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Career Roadmap</h3>
            <p className="text-sm text-muted-foreground">Full Stack Developer Path</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-secondary" asChild>
          <Link to="/dashboard/roadmap">
            View Full Roadmap
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm font-bold text-secondary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={milestone.title} className="flex items-start gap-3">
            <div className="relative">
              {milestone.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              ) : milestone.status === "in-progress" ? (
                <div className="w-5 h-5 rounded-full border-2 border-secondary bg-secondary/20 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
              {index < milestones.length - 1 && (
                <div className="absolute top-6 left-2.5 w-px h-8 bg-border" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  milestone.status === "completed" ? "text-muted-foreground line-through" :
                  milestone.status === "in-progress" ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {milestone.title}
                </span>
                {milestone.status === "in-progress" && milestone.progress > 0 && (
                  <span className="text-xs text-secondary font-medium">{Math.round(milestone.progress)}%</span>
                )}
              </div>
              {milestone.status === "in-progress" && milestone.progress > 0 && (
                <Progress value={milestone.progress} className="h-1.5 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapCard;
