import { Upload, Sparkles, MessageSquare, Briefcase } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Resume",
    description: "Start by uploading your existing resume or create one from scratch using our AI-powered builder.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Get AI Analysis",
    description: "Our AI analyzes your resume, extracts skills, and identifies gaps for your target role.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Practice Interviews",
    description: "Prepare with AI mock interviews tailored to your role and get instant feedback.",
  },
  {
    icon: Briefcase,
    step: "04",
    title: "Get Discovered",
    description: "Connect with verified recruiters who can see your skills and interview readiness.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Your Path to{" "}
            <span className="text-primary">Career Success</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Four simple steps to transform your career journey with AI-powered guidance.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative group">
                {/* Step Card */}
                <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 hover:-translate-y-1 relative z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-sm shadow-lg">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-secondary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <div className="w-8 h-8 rounded-full bg-card border-2 border-secondary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
