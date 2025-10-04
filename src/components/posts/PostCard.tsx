import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import AudioPlayer from "../audio/AudioPlayer";
import ShareDialog from "../social/ShareDialog";
import SwipeableMic from "./SwipeableMic";

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
  const [showCommentRecorder, setShowCommentRecorder] = useState(false);

  const handleSwipeComplete = () => {
    setShowCommentRecorder(true);
    // Here you would open the comment recording modal
    console.log("Opening comment recorder...");
  };

  return (
    <>
      <Card 
        className="relative overflow-hidden border-none shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all"
        style={{
          background: author.avatar 
            ? `linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%), url(${author.avatar}) center/cover`
            : 'rgba(255,255,255,0.8)'
        }}
      >
        {/* Profile background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/90 pointer-events-none" />

        <CardContent className="relative p-4 space-y-3">
          {/* Top section with swipeable mic and like button */}
          <div className="flex items-start justify-between">
            {/* Swipeable comment mic */}
            <div className="w-48">
              <SwipeableMic onSwipeComplete={handleSwipeComplete} />
            </div>

            {/* Like button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={`rounded-full w-10 h-10 p-0 ${
                liked 
                  ? "bg-primary hover:bg-primary/90" 
                  : "bg-white/60 hover:bg-white/80 backdrop-blur-sm"
              }`}
            >
              <Heart 
                className={`w-5 h-5 ${
                  liked ? "fill-black text-black" : "text-black"
                }`} 
              />
            </Button>
          </div>

          {/* Author info */}
          <div className="flex items-center space-x-3 mt-4">
            <Avatar className="border-2 border-primary w-12 h-12">
              <AvatarImage src={author.avatar} />
              <AvatarFallback className="bg-gradient-echo text-black font-bold">
                {author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">@{author.username}</p>
            </div>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>

          {/* Audio player */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3">
            <AudioPlayer audioUrl={audioUrl} duration={duration} />
          </div>

          {/* Stats and actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{liked ? likes + 1 : likes}</span> loves
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{comments}</span> echoes
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="text-xs font-medium hover:bg-primary/10 hover:text-primary"
            >
              Share
            </Button>
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
