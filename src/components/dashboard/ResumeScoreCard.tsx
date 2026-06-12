import { FileText, CheckCircle, XCircle, AlertCircle, Upload, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ResumeScoreCardProps {
  atsScore: number;
  roadmapData?: any; // AI-generated roadmap data with real ATS analysis
}

const ResumeScoreCard = ({ atsScore, roadmapData }: ResumeScoreCardProps) => {
  // Use real ATS score from roadmap data if available
  const realAtsScore = roadmapData?.resumeScore || atsScore;
  const scoreColor = realAtsScore >= 80 ? "text-success" : realAtsScore >= 60 ? "text-accent" : "text-destructive";

  // Use real analysis data if available
  const checks = roadmapData?.sections ? [
    { 
      label: "Contact Information", 
      status: roadmapData.sections.contactInfo?.status === "excellent" ? "pass" : 
              roadmapData.sections.contactInfo?.status === "good" ? "warning" : "fail",
      feedback: roadmapData.sections.contactInfo?.feedback
    },
    { 
      label: "Work Experience", 
      status: roadmapData.sections.experience?.status === "excellent" ? "pass" : 
              roadmapData.sections.experience?.status === "good" ? "warning" : "fail",
      feedback: roadmapData.sections.experience?.feedback
    },
    { 
      label: "Skills Section", 
      status: roadmapData.sections.skills?.status === "excellent" ? "pass" : 
              roadmapData.sections.skills?.status === "good" ? "warning" : "fail",
      feedback: roadmapData.sections.skills?.feedback
    },
    { 
      label: "ATS Keywords", 
      status: roadmapData.sections.keywords?.status === "excellent" ? "pass" : 
              roadmapData.sections.keywords?.status === "good" ? "warning" : "fail",
      feedback: roadmapData.sections.keywords?.feedback
    },
    { 
      label: "Education Details", 
      status: roadmapData.sections.education?.status === "excellent" ? "pass" : 
              roadmapData.sections.education?.status === "good" ? "warning" : "fail",
      feedback: roadmapData.sections.education?.feedback
    },
  ] : [
    { label: "Contact Information", status: realAtsScore > 0 ? "pass" : "pending" },
    { label: "Work Experience", status: realAtsScore >= 60 ? "pass" : realAtsScore > 0 ? "warning" : "pending" },
    { label: "Skills Section", status: realAtsScore >= 40 ? "pass" : realAtsScore > 0 ? "warning" : "pending" },
    { label: "ATS Keywords", status: realAtsScore >= 80 ? "pass" : realAtsScore >= 60 ? "warning" : realAtsScore > 0 ? "fail" : "pending" },
    { label: "Education Details", status: realAtsScore >= 20 ? "pass" : realAtsScore > 0 ? "warning" : "pending" },
  ];

  if (realAtsScore === 0 && !roadmapData) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">ATS Resume Score</h3>
              <p className="text-sm text-muted-foreground">Get AI-powered analysis</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">Not Analyzed</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your resume to get an AI-powered ATS score and personalized improvement suggestions using GPT-4.1.
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
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            {roadmapData ? (
              <Brain className="w-6 h-6 text-secondary" />
            ) : (
              <FileText className="w-6 h-6 text-secondary" />
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              ATS Resume Score
              {roadmapData && <Badge variant="default" className="text-xs">AI-Powered</Badge>}
            </h3>
            <p className="text-sm text-muted-foreground">
              {roadmapData ? `Best match: ${roadmapData.bestMatchRole}` : "Last analyzed recently"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/ats-analyzer">
            Analyze Again
          </Link>
        </Button>
      </div>

      {/* Score Circle */}
      <div className="flex items-center gap-8 mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(realAtsScore / 100) * 352} 352`}
              strokeLinecap="round"
              className={scoreColor}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{realAtsScore}%</span>
            <span className="text-xs text-muted-foreground">ATS Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-3" title={check.feedback}>
              {check.status === "pass" && (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              )}
              {check.status === "warning" && (
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
              )}
              {check.status === "fail" && (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              )}
              {check.status === "pending" && (
                <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
              )}
              <span className="text-sm text-foreground">{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Stats */}
      {roadmapData && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{roadmapData.extractedSkills?.length || 0}</div>
            <div className="text-xs text-blue-700">Skills Found</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{roadmapData.targetRoles?.length || 0}</div>
            <div className="text-xs text-green-700">Target Roles</div>
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
        <h4 className="font-semibold text-accent text-sm mb-2">💡 AI Recommendation</h4>
        <p className="text-sm text-foreground/80">
          {roadmapData?.suggestions?.[0] || 
           (realAtsScore < 60 
            ? "Add more relevant keywords and improve formatting to boost your ATS score."
            : realAtsScore < 80 
            ? "Great progress! Add industry-specific keywords to reach 80%+ score."
            : "Excellent! Your resume is well-optimized for ATS systems."
          )}
        </p>
        {roadmapData && (
          <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto" asChild>
            <Link to="/ats-analyzer" className="text-accent">
              View Full Analysis →
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResumeScoreCard;
