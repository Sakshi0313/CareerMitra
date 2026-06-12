import { FileText, Brain, Mic, Users, Target, TrendingUp, Award, BookOpen } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "ATS Resume Builder",
    description: "Build and analyze resumes that pass Applicant Tracking Systems with AI-powered optimization.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Brain,
    title: "Smart Skill Analysis",
    description: "AI extracts and evaluates your skills, identifying gaps for your target roles.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Mic,
    title: "Voice Mock Interviews",
    description: "Practice with AI-powered voice interviews and get instant feedback on your responses.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: TrendingUp,
    title: "Career Roadmaps",
    description: "Get personalized learning paths with curated courses, certifications, and resources.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Target,
    title: "Role-Based Prep",
    description: "Interview questions and preparation tailored to your specific target role.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Users,
    title: "Recruiter Discovery",
    description: "Get discovered by verified recruiters based on your skills and readiness.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Award,
    title: "Skill Verification",
    description: "Showcase verified skills and achievements to stand out to employers.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Learning Resources",
    description: "Access curated YouTube tutorials, articles, and certification recommendations.",
    color: "bg-accent/10 text-accent",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-secondary">Launch Your Career</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From resume building to interview preparation, our AI-powered platform provides comprehensive career guidance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
