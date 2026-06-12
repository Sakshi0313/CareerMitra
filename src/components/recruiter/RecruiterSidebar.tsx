import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/SimpleAuthContext";

interface RecruiterSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const RecruiterSidebar = ({ activeSection, onSectionChange }: RecruiterSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      section: "dashboard"
    },
    {
      title: "Student Profiles",
      icon: Users,
      section: "students"
    },
    {
      title: "Messages",
      icon: MessageSquare,
      section: "messages"
    },
    {
      title: "Profile",
      icon: UserCircle,
      section: "profile"
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        className="fixed top-4 left-4 lg:hidden z-40 p-2 hover:bg-gray-100 rounded-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          isCollapsed ? "w-0 lg:w-64" : "w-64"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Logo/Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recruiter</h2>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.section;
              
              return (
                <button
                  key={item.section}
                  onClick={() => {
                    onSectionChange(item.section);
                    setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content offset */}
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-64" : ""}`} />
    </>
  );
};

export default RecruiterSidebar;
