import { Zap, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillsCardProps {
  skillsCount: number;
}

const SkillsCard = ({ skillsCount }: SkillsCardProps) => {
  // Generate skills based on count
  const allSkills = [
    { name: "React", level: 85, color: "bg-secondary" },
    { name: "TypeScript", level: 70, color: "bg-primary" },
    { name: "Node.js", level: 60, color: "bg-success" },
    { name: "Python", level: 45, color: "bg-accent" },
    { name: "SQL", level: 55, color: "bg-secondary" },
    { name: "JavaScript", level: 90, color: "bg-accent" },
    { name: "HTML/CSS", level: 95, color: "bg-success" },
    { name: "Git", level: 75, color: "bg-primary" },
  ];

  const skills = allSkills.slice(0, skillsCount);
  const suggestedSkills = ["Docker", "AWS", "GraphQL", "MongoDB", "Redux"];

  if (skillsCount === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Skills Profile</h3>
              <p className="text-sm text-muted-foreground">Build your skills profile</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">No Skills Added</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Add your technical skills to help recruiters find you and get personalized recommendations.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Your Skills
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Skills Profile</h3>
            <p className="text-sm text-muted-foreground">{skills.length} skills added</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4" />
          Add Skill
        </Button>
      </div>

      {/* Skills List */}
      <div className="space-y-4 mb-6">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{skill.name}</span>
              <span className="text-xs text-muted-foreground">{skill.level}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${skill.color} transition-all duration-500`}
                style={{ width: `${skill.level}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Skills */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Suggested Skills to Learn</h4>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills.slice(0, 3).map((skill) => (
            <button
              key={skill}
              className="px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsCard;
