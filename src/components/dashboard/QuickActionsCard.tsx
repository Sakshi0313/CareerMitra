import { FileText, Upload, Mic, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { 
    icon: Upload, 
    label: "Upload Resume", 
    description: "Analyze your resume",
    path: "/ats-analyzer",
    color: "bg-secondary/10 text-secondary hover:bg-secondary/20" 
  },
  { 
    icon: FileText, 
    label: "Build Resume", 
    description: "Create ATS-friendly resume",
    path: "/resume-builder",
    color: "bg-primary/10 text-primary hover:bg-primary/20" 
  },
  { 
    icon: Mic, 
    label: "Interview Practice", 
    description: "AI-powered mock interviews",
    path: "/mock-interview",
    color: "bg-accent/10 text-accent hover:bg-accent/20" 
  },
  { 
    icon: TrendingUp, 
    label: "Career Path", 
    description: "View your roadmap",
    path: "/dashboard/roadmap",
    color: "bg-success/10 text-success hover:bg-success/20" 
  },
  { 
    icon: Target, 
    label: "Skill Gap", 
    description: "Find missing skills",
    path: "/dashboard/profile",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20" 
  },
];

const QuickActionsCard = () => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className={`p-4 rounded-xl transition-all duration-200 hover:-translate-y-1 ${action.color}`}
          >
            <action.icon className="w-6 h-6 mb-3" />
            <div className="font-medium text-sm text-foreground">{action.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsCard;
