import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Users, Radio, Play, Mic } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import AudioRecorder from "@/components/audio/AudioRecorder";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const Profile = () => {
  const [voiceIntroDialogOpen, setVoiceIntroDialogOpen] = useState(false);
  const [hasVoiceIntro, setHasVoiceIntro] = useState(false);

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

  const handleVoiceIntroComplete = (blob: Blob) => {
    setHasVoiceIntro(true);
    toast.success("Voice intro saved!");
    setVoiceIntroDialogOpen(false);
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
                <Avatar className="w-24 h-24 border-4 border-primary shadow-echo">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-echo text-black text-3xl font-black">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>
                  
                  <p className="text-foreground">{user.bio}</p>

                  {/* Voice Intro Section */}
                  <div className="pt-2">
                    {hasVoiceIntro ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Radio className="w-4 h-4 text-primary" />
                          <p className="text-sm font-semibold text-primary">Voice Intro</p>
                        </div>
                        <AudioPlayer audioUrl="" duration={45} />
                      </div>
                    ) : (
                      <Dialog open={voiceIntroDialogOpen} onOpenChange={setVoiceIntroDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-primary/50 text-primary hover:bg-primary/10"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Add Voice Intro
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Record Your Voice Intro</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Introduce yourself with a short audio message (max 60 seconds)
                            </p>
                            <AudioRecorder 
                              onRecordingComplete={handleVoiceIntroComplete}
                              maxDuration={60}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{user.stats.connections}</span>
                      <span className="text-muted-foreground">Connections</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{user.stats.posts}</span>
                      <span className="text-muted-foreground">Echoes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">{user.stats.audioMinutes}</span>
                      <span className="text-muted-foreground">minutes shared</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="border-border hover:bg-primary/10 hover:text-primary">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User's Posts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Echoes</h2>
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
