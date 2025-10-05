import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import AudioPlayer from "../audio/AudioPlayer";
import ShareDialog from "../social/ShareDialog";
import SwipeableMic from "./SwipeableMic";
import CommentDialog from "./CommentDialog";

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
      <Card className="relative overflow-hidden border-none aspect-square w-full">
        {/* Profile picture background */}
        {author.avatar ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${author.avatar})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-echo" />
        )}
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        <CardContent className="relative h-full p-4 flex flex-col">
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
              className={`rounded-full w-12 h-12 p-0 ${
                liked 
                  ? "bg-primary hover:bg-primary/90" 
                  : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              }`}
            >
              <Heart 
                className={`w-6 h-6 ${
                  liked ? "fill-black text-black" : "text-white"
                }`} 
              />
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Audio player */}
          <div className="mb-4">
            <AudioPlayer audioUrl={audioUrl} duration={duration} />
          </div>

          {/* Bottom section - User info and stats */}
          <div className="space-y-3">
            {/* User name - bottom left, no avatar circle */}
            <div>
              <p className="font-bold text-white text-lg drop-shadow-lg">{author.name}</p>
              <p className="text-sm text-white/80 drop-shadow-md">@{author.username}</p>
            </div>

            {/* Stats and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-white/90 drop-shadow-md">
                  <span className="font-semibold">{liked ? likes + 1 : likes}</span> loves
                </span>
                <span className="text-white/90 drop-shadow-md">
                  <span className="font-semibold">{comments}</span> echoes
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareOpen(true)}
                className="text-xs font-medium bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                Share
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

      <CommentDialog
        open={showCommentRecorder}
        onOpenChange={setShowCommentRecorder}
      />
    </>
  );
};

export default PostCard;

