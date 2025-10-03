import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Repeat2 } from "lucide-react";
import AudioPlayer from "../audio/AudioPlayer";
import ShareDialog from "../social/ShareDialog";

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  audioUrl: string;
  duration: number;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isReechoed?: boolean;
}

const PostCard = ({
  author,
  audioUrl,
  duration,
  timestamp,
  likes,
  comments,
  isLiked = false,
  isReechoed = false,
}: PostCardProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [reechoed, setReechoed] = useState(isReechoed);
  
  return (
    <>
      <Card className="border-border bg-card hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="border-2 border-primary">
              <AvatarImage src={author.avatar} />
              <AvatarFallback className="bg-gradient-echo text-black font-bold">
                {author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{author.name}</p>
              <p className="text-sm text-muted-foreground">@{author.username}</p>
            </div>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <AudioPlayer audioUrl={audioUrl} duration={duration} />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLiked(!liked)}
                className={`space-x-2 hover:bg-primary/10 ${liked ? "text-primary" : "text-muted-foreground"}`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span>{liked ? likes + 1 : likes}</span>
              </Button>

              <Button variant="ghost" size="sm" className="space-x-2 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setReechoed(!reechoed)}
                className={`space-x-2 hover:bg-primary/10 ${reechoed ? "text-primary" : "text-muted-foreground"}`}
              >
                <Repeat2 className="w-4 h-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShareOpen(true)}
                className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShareDialog 
        open={shareOpen} 
        onOpenChange={setShareOpen}
        postId={author.username}
      />
    </>
  );
};

export default PostCard;
