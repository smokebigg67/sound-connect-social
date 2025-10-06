import { useQuery } from '@tanstack/react-query';
import { postsAPI } from '@/lib/api';
import PostCard from '@/components/posts/PostCard';
import CreatePost from '@/components/posts/CreatePost';

export default function HomePage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsAPI.getAll().then(res => res.data)
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreatePost />
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts?.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
