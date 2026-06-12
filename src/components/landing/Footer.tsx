import { GraduationCap, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-background">
                CareerMitra
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI-powered career platform connecting students with their dream opportunities.
            </p>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-semibold text-background mb-4">For Students</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Resume Builder</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Mock Interviews</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Career Roadmaps</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Skill Assessment</a></li>
            </ul>
          </div>

          {/* For Recruiters */}
          <div>
            <h4 className="font-semibold text-background mb-4">For Recruiters</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Find Candidates</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Post Jobs</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Verified Badge</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Pricing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors text-sm">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-muted-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 CareerMitra. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/test-firebase" className="text-muted-foreground hover:text-secondary transition-colors text-sm">
              Test Firebase
            </Link>
            <a href="#" className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center hover:bg-secondary/20 transition-colors">
              <Twitter className="w-5 h-5 text-muted-foreground" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center hover:bg-secondary/20 transition-colors">
              <Linkedin className="w-5 h-5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
