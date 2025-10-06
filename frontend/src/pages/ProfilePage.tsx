import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, postsAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, UserPlus, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/posts/PostCard';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, logout } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => usersAPI.getProfile(userId).then(res => res.data)
  });

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', userId || currentUser?.id],
    queryFn: () => postsAPI.getUserPosts?.(userId || currentUser?.id).then(res => res.data) || Promise.resolve({ posts: [] })
  });

  const isOwnProfile = !userId || userId === currentUser?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = profile?.user?.profile?.displayName || profile?.user?.username;
  const stats = profile?.user?.stats || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile?.user?.profile?.avatar} />
            <AvatarFallback className="text-2xl">
              {displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">@{profile?.user?.username}</p>
              {profile?.user?.profile?.bio && (
                <p className="mt-2 text-sm">{profile.user.profile.bio}</p>
              )}
            </div>
            
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{stats.postCount || 0}</div>
                <div className="text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats.connectionCount || 0}</div>
                <div className="text-muted-foreground">Connections</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{Math.floor((stats.audioMinutes || 0) / 60)}h</div>
                <div className="text-muted-foreground">Audio Time</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            {isOwnProfile ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button onClick={logout} variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : userPosts?.posts?.length > 0 ? (
            userPosts.posts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="space-y-4">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold">About</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <p>@{profile?.user?.username}</p>
              </div>
              
              {profile?.user?.profile?.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p>{profile.user.profile.bio}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Joined</label>
                <p>{new Date(profile?.user?.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Audio Time</label>
                <p>{Math.floor((stats.audioMinutes || 0) / 60)} hours {(stats.audioMinutes || 0) % 60} minutes</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
