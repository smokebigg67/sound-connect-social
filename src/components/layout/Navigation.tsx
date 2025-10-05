import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, User, PlusCircle, Radio } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const tabs = [
    { 
      title: "Feed", 
      icon: Home, 
      onClick: () => navigate("/feed"),
      isActive: isActive("/feed")
    },
    { 
      title: "Connections", 
      icon: Users, 
      onClick: () => navigate("/connections"),
      isActive: isActive("/connections")
    },
    { 
      title: "Profile", 
      icon: User, 
      onClick: () => navigate("/profile"),
      isActive: isActive("/profile")
    },
    { type: "separator" as const },
    { 
      title: "Echo", 
      icon: PlusCircle, 
      onClick: () => navigate("/create"),
      isActive: isActive("/create")
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate("/feed")} 
            className="flex items-center space-x-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-echo flex items-center justify-center shadow-echo">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-black text-primary tracking-tight">
              ECHO
            </span>
          </div>

          {/* Expandable Tabs */}
          <ExpandableTabs tabs={tabs} activeColor="text-primary" />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
