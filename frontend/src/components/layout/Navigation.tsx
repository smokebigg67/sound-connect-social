import { NavLink } from 'react-router-dom';
import { Home, Compass, User, Users, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Navigation() {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-card border-t md:border-b md:border-t-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around md:justify-between h-16">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              ECHO
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Home className="w-6 h-6" />
              <span className="text-xs md:text-sm">Home</span>
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Compass className="w-6 h-6" />
              <span className="text-xs md:text-sm">Explore</span>
            </NavLink>

            <NavLink
              to="/connections"
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Users className="w-6 h-6" />
              <span className="text-xs md:text-sm">Connections</span>
            </NavLink>

            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Bell className="w-6 h-6" />
              <span className="text-xs md:text-sm">Notifications</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <User className="w-6 h-6" />
              <span className="text-xs md:text-sm">Profile</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
