import Navigation from "@/components/layout/Navigation";
import PostCard from "@/components/posts/PostCard";
import SwipeableCardContainer from "@/components/posts/SwipeableCardContainer";

const Feed = () => {
  // Mock data
  const posts = [
    {
      id: "1",
      author: {
        name: "Alex Chen",
        username: "audioexplorer",
        avatar: "",
      },
      audioUrl: "",
      duration: 120,
      timestamp: "2h ago",
      likes: 42,
      comments: 8,
      isLiked: true,
    },
    {
      id: "2",
      author: {
        name: "Maria Rodriguez",
        username: "voiceartist",
        avatar: "",
      },
      audioUrl: "",
      duration: 180,
      timestamp: "5h ago",
      likes: 67,
      comments: 12,
    },
    {
      id: "3",
      author: {
        name: "James Wilson",
        username: "soundwave",
        avatar: "",
      },
      audioUrl: "",
      duration: 240,
      timestamp: "1d ago",
      likes: 103,
      comments: 24,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black">
              Your <span className="text-primary">ECHO</span> Feed
            </h1>
            <p className="text-muted-foreground text-sm">
              Swipe left to explore more echoes
            </p>
          </div>

          <SwipeableCardContainer>
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </SwipeableCardContainer>
        </div>
      </main>
    </div>
  );
};

export default Feed;
