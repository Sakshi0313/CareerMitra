import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary-foreground/90">
              AI-Powered Career Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up leading-tight">
            Launch Your Career with{" "}
            <span className="relative">
              <span className="relative z-10 text-secondary">AI Guidance</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-secondary/30 -rotate-1" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Build ATS-friendly resumes, practice AI mock interviews, and get hired by top Indian companies—all in one platform designed for Indian students.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Enhanced Animated Stats Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Students Placed */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30">
                <div className="text-3xl md:text-4xl font-black text-black mb-2 drop-shadow-sm">25K+</div>
                <div className="text-sm font-bold text-black/80 drop-shadow-sm">Indian Students Placed</div>
              </div>
            </div>

            {/* Companies */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl blur opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="relative bg-white rounded-2xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30">
                <div className="text-3xl md:text-4xl font-black text-black mb-2 drop-shadow-sm">800+</div>
                <div className="text-sm font-bold text-black/80 drop-shadow-sm">Indian Companies</div>
              </div>
            </div>

            {/* Placement Rate */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="relative bg-white rounded-2xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30">
                <div className="text-3xl md:text-4xl font-black text-black mb-2 drop-shadow-sm">92%</div>
                <div className="text-sm font-bold text-black/80 drop-shadow-sm">Placement Rate</div>
              </div>
            </div>

            {/* ATS Score */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl blur opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="relative bg-white rounded-2xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-6 h-6 text-black/70 mr-2 drop-shadow-sm" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-black mb-1 drop-shadow-sm">92%</div>
                <div className="text-sm font-bold text-black/80 drop-shadow-sm">ATS Score</div>
              </div>
            </div>

            {/* Skills Matched */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="relative bg-white rounded-2xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-white/30">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-black/70 mr-2 drop-shadow-sm" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-black mb-1 drop-shadow-sm">12/15</div>
                <div className="text-sm font-bold text-black/80 drop-shadow-sm">Skills Matched</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
