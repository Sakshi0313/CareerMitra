import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  TrendingUp, 
  User,
  Video,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/SimpleAuthContext";

const primaryMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "ATS Analyzer", path: "/ats-analyzer" },
  { icon: Video, label: "Interview", path: "/mock-interview" },
  { icon: TrendingUp, label: "Roadmap", path: "/dashboard/roadmap" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
];

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: User, label: "My Profile", path: "/dashboard/profile" },
  { icon: FileText, label: "Resume Builder", path: "/resume-builder" },
  { icon: Target, label: "ATS Analyzer", path: "/ats-analyzer" },
  { icon: TrendingUp, label: "Career Roadmap", path: "/dashboard/roadmap" },
  { icon: Video, label: "Interview Practice", path: "/mock-interview" },
  { icon: MessageSquare, label: "Opportunities", path: "/opportunities" },
];

const MobileBottomNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar - Only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryMenuItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-0 flex-1 h-auto"
              >
                <Menu className="w-5 h-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">Navigation Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {allMenuItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                
                {/* Logout Button */}
                <div className="p-4 border-t border-border">
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;