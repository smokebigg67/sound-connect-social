import Navigation from "@/components/layout/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Users, Mic } from "lucide-react";
import PostCard from "@/components/posts/PostCard";

const Profile = () => {
  const user = {
    name: "Alex Chen",
    username: "audioexplorer",
    bio: "Podcast enthusiast | Audio storyteller | Connecting through voice",
    stats: {
      connections: 234,
      posts: 89,
      audioMinutes: 1247,
    },
  };

  const userPosts = [
    {
      id: "1",
      author: {
        name: user.name,
        username: user.username,
        avatar: "",
      },
      audioUrl: "",
      duration: 120,
      timestamp: "2h ago",
      likes: 42,
      comments: 8,
      isLiked: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-audio text-white text-3xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                  
                  <p className="text-foreground">{user.bio}</p>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{user.stats.connections}</span>
                      <span className="text-muted-foreground">Connections</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{user.stats.posts}</span>
                      <span className="text-muted-foreground">Posts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{user.stats.audioMinutes}</span>
                      <span className="text-muted-foreground">minutes shared</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="border-border">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User's Posts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Posts</h2>
            {userPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
