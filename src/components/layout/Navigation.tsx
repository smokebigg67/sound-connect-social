import { Link, useLocation } from "react-router-dom";
import { Home, Users, User, PlusCircle, Radio } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-echo flex items-center justify-center shadow-echo">
              <Radio className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-black text-primary tracking-tight">
              ECHO
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
                      ? "bg-gradient-echo hover:opacity-90 text-black font-bold"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                className="bg-gradient-echo hover:opacity-90 ml-2 text-black font-bold shadow-echo"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Echo</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
