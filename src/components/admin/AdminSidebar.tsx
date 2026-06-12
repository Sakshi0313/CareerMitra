import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard,
  Users,
  Building,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/contexts/SimpleAuthContext";

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
      badge: null
    },
    {
      title: "Students",
      icon: GraduationCap,
      path: "/admin/students",
      badge: null
    },
    {
      title: "Recruiters",
      icon: Building,
      path: "/admin/recruiters",
      badge: null
    },
    {
      title: "Pending Approvals",
      icon: AlertTriangle,
      path: "/admin/approvals",
      badge: "3"
    },
    {
      title: "Analytics",
      icon: BarChart3,
      path: "/admin/analytics",
      badge: null
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/admin/settings",
      badge: null
    }
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">CareerMitra</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive(item.path) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-foreground ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-40 lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
};

export default AdminSidebar;