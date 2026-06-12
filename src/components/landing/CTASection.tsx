import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary-foreground/90">
              Start Your Journey Today
            </span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Career?
          </h2>

          <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl mx-auto">
            Join thousands of students and freshers who are already using CareerMitra to land their dream jobs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Get Started for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl">
              Talk to Us
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/50">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
