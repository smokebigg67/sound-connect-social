import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal, Trash2 } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AudioPlayer from '@/components/audio/AudioPlayer';
import AudioVisualizer from '@/components/audio/AudioVisualizer';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  _id: string;
  authorId: {
    _id: string;
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
    };
  };
  audio: {
    url: string;
    duration: number;
    format: string;
  };
  content: {
    title?: string;
    transcription?: string;
    tags?: string[];
  };
  engagement: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
    listenCount: number;
  };
  likedBy?: string[];
  createdAt: string;
  privacy: 'public' | 'connections_only' | 'private';
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTranscription, setShowTranscription] = useState(false);
  
  const isLiked = post.likedBy?.includes(user?.id || '') || false;
  const isAuthor = post.authorId._id === user?.id;

  const likeMutation = useMutation({
    mutationFn: () => postsAPI.like(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      toast.error('Failed to like post');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsAPI.delete(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  const recordListenMutation = useMutation({
    mutationFn: () => postsAPI.recordListen?.(post._id) || Promise.resolve(),
    onError: () => {
      // Silently fail - listen tracking is not critical
    }
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate();
    }
  };

  const handlePlay = () => {
    recordListenMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.content.title || `Audio post by ${post.authorId.username}`,
          text: post.content.transcription || 'Check out this audio post on ECHO',
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const displayName = post.authorId.profile.displayName || post.authorId.username;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.authorId.profile.avatar} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">@{post.authorId.username}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content.title && (
        <h3 className="font-medium text-lg">{post.content.title}</h3>
      )}

      {/* Audio Player */}
      <div className="space-y-2">
        <AudioVisualizer audioSrc={post.audio.url} height={80} />
        <AudioPlayer
          src={post.audio.url}
          duration={post.audio.duration}
          onPlay={handlePlay}
        />
      </div>

      {/* Transcription */}
      {post.content.transcription && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-xs"
          >
            {showTranscription ? 'Hide' : 'Show'} Transcription
          </Button>
          
          {showTranscription && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground italic">
                "{post.content.transcription}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.content.tags && post.content.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.content.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`space-x-1 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{post.engagement.likeCount}</span>
          </Button>

          <Button variant="ghost" size="sm" className="space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">{post.engagement.commentCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="space-x-1"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">{post.engagement.shareCount}</span>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {post.engagement.listenCount} listens
        </div>
      </div>
    </div>
  );
}