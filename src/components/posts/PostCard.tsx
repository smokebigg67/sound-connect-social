import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import AudioPlayer from "../audio/AudioPlayer";

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
}

const PostCard = ({
  author,
  audioUrl,
  duration,
  timestamp,
  likes,
  comments,
  isLiked = false,
}: PostCardProps) => {
  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={author.avatar} />
            <AvatarFallback className="bg-gradient-audio text-white">
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

        <div className="flex items-center space-x-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={`space-x-2 ${isLiked ? "text-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{likes}</span>
          </Button>

          <Button variant="ghost" size="sm" className="space-x-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
