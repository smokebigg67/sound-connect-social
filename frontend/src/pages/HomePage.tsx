import { useQuery } from '@tanstack/react-query';
import { postsAPI } from '@/lib/api';
import PostCard from '@/components/posts/PostCard';
import CreatePost from '@/components/posts/CreatePost';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  const { data: feedPosts, isLoading: feedLoading } = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: () => postsAPI.getFeed?.().then(res => res.data) || postsAPI.getAll().then(res => res.data)
  });

  const { data: trendingPosts, isLoading: trendingLoading } = useQuery({
    queryKey: ['posts', 'trending'],
    queryFn: () => postsAPI.getTrending?.().then(res => res.data) || postsAPI.getAll().then(res => res.data)
  });

  const { data: explorePosts, isLoading: exploreLoading } = useQuery({
    queryKey: ['posts', 'explore'],
    queryFn: () => postsAPI.getExplore?.().then(res => res.data) || postsAPI.getAll().then(res => res.data)
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreatePost />
      
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">My Feed</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="explore">Explore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="space-y-4">
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : feedPosts?.posts?.length > 0 ? (
            feedPosts.posts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No posts in your feed yet. Connect with others to see their posts!
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="space-y-4">
          {trendingLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : trendingPosts?.posts?.length > 0 ? (
            trendingPosts.posts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No trending posts yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="explore" className="space-y-4">
          {exploreLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : explorePosts?.posts?.length > 0 ? (
            explorePosts.posts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts to explore yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
