import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/SimpleAuthContext";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { userProfile } = useAuth();
  
  const displayName = userProfile?.displayName || 'User';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const role = userProfile?.role === 'student' ? 'Student' : 
               userProfile?.role === 'recruiter' ? 'Recruiter' : 
               userProfile?.role === 'admin' ? 'Admin' : 'User';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-10 w-64 bg-muted border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-secondary-foreground font-semibold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-foreground">{displayName}</div>
            <div className="text-xs text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
