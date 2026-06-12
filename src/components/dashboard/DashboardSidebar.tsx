import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  TrendingUp, 
  LogOut,
  GraduationCap,
  User,
  ChevronLeft,
  ChevronRight,
  Video,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: User, label: "My Profile", path: "/dashboard/profile" },
  { icon: FileText, label: "Resume Builder", path: "/resume-builder" },
  { icon: Target, label: "ATS Analyzer (Enhanced)", path: "/ats-analyzer" },
  { icon: TrendingUp, label: "Career Roadmap", path: "/dashboard/roadmap" },
  { icon: Video, label: "Interview Practice", path: "/mock-interview" },
  { icon: MessageSquare, label: "Opportunities", path: "/opportunities" },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-border flex-col transition-all duration-300 z-40 hidden lg:flex",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-foreground">
              CareerMitra
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-secondary text-secondary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-secondary-foreground")} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
};

export default DashboardSidebar;
