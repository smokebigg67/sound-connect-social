import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: (formData: FormData) => postsAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      toast.success('Post created!');
    },
    onError: () => {
      toast.error('Failed to create post');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append('content', content);
    createPost.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-4 space-y-4">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm">
          <Mic className="w-4 h-4 mr-2" />
          Record Audio
        </Button>
        <Button type="submit" disabled={!content.trim() || createPost.isPending}>
          {createPost.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
