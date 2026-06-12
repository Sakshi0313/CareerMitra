import { Mic, Play, Clock, Award, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface InterviewPrepCardProps {
  interviewCount: number;
}

const InterviewPrepCard = ({ interviewCount }: InterviewPrepCardProps) => {
  // Generate mock recent interviews based on count
  const recentInterviews = interviewCount > 0 ? [
    { role: "React Developer", score: 85, date: "Recent", duration: "25 min" },
    { role: "Full Stack Engineer", score: 72, date: "2 days ago", duration: "30 min" },
    { role: "Frontend Developer", score: 90, date: "1 week ago", duration: "20 min" },
  ].slice(0, Math.min(interviewCount, 3)) : [];

  if (interviewCount === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mic className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Mock Interviews</h3>
              <p className="text-sm text-muted-foreground">Practice with AI interviewer</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">No Interviews Yet</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Start practicing with AI-powered mock interviews to improve your skills and confidence.
          </p>
          <Button asChild>
            <Link to="/mock-interview">
              <Play className="w-4 h-4 mr-2" />
              Start First Interview
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
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Mic className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Mock Interviews</h3>
            <p className="text-sm text-muted-foreground">{interviewCount} sessions completed</p>
          </div>
        </div>
      </div>

      {/* Start Interview CTA */}
      <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-secondary mb-1">Ready to practice?</h4>
            <p className="text-sm text-muted-foreground">Start a voice-based mock interview</p>
          </div>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/mock-interview">
              <Play className="w-5 h-5 mr-2" />
              Start Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Interviews */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-4">Recent Sessions</h4>
        <div className="space-y-3">
          {recentInterviews.map((interview, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{interview.role}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {interview.duration} • {interview.date}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-bold ${
                interview.score >= 80 ? "text-success" : 
                interview.score >= 60 ? "text-accent" : "text-destructive"
              }`}>
                {interview.score}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepCard;
