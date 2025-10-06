import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, logout } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => usersAPI.getProfile(userId).then(res => res.data)
  });

  const isOwnProfile = !userId || userId === currentUser?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{profile?.username}</h1>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
          {isOwnProfile && (
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
