import { Link, useLocation } from "react-router-dom";
import { Home, Users, User, PlusCircle, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/feed", icon: Home, label: "Feed" },
    { path: "/connections", icon: Users, label: "Connections" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-audio flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-audio bg-clip-text text-transparent">
              VoiceConnect
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={
                    isActive(item.path)
                      ? "bg-gradient-audio hover:opacity-90"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}

            <Link to="/create">
              <Button
                size="sm"
                className="bg-gradient-audio hover:opacity-90 ml-2"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
