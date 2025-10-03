import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import AudioRecorder from "@/components/audio/AudioRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const CreatePost = () => {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handlePublish = () => {
    if (!audioBlob) {
      toast.error("Please record an audio message first");
      return;
    }

    // Mock publish
    toast.success("Post published successfully!");
    navigate("/feed");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/feed")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Audio Post</h1>
              <p className="text-muted-foreground">
                Share your thoughts with your connections
              </p>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Record Your Message</CardTitle>
              <CardDescription>
                Record up to 5 minutes of audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="What's on your mind?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="border border-border rounded-lg p-6 bg-background">
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDuration={300}
                />
              </div>

              <Button
                onClick={handlePublish}
                disabled={!audioBlob}
                className="w-full bg-gradient-audio hover:opacity-90 disabled:opacity-50"
              >
                Publish Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
