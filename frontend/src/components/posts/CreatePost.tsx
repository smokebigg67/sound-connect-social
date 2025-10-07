import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Hash, Globe, Users, Lock } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AudioRecorder from '@/components/audio/AudioRecorder';
import { toast } from '@/hooks/use-toast';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'connections_only' | 'private'>('public');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: (formData: FormData) => postsAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      resetForm();
      toast.success('Post created!');
    },
    onError: () => {
      toast.error('Failed to create post');
    }
  });

  const resetForm = () => {
    setTitle('');
    setTags([]);
    setCurrentTag('');
    setPrivacy('public');
    setAudioBlob(null);
    setShowRecorder(false);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setShowRecorder(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBlob) {
      toast.error('Please record an audio message');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob);
    if (title.trim()) formData.append('title', title);
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
    formData.append('privacy', privacy);
    
    createPost.mutate(formData);
  };

  const privacyIcons = {
    public: Globe,
    connections_only: Users,
    private: Lock
  };

  const PrivacyIcon = privacyIcons[privacy];

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Create Audio Post</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRecorder(!showRecorder)}
          className={showRecorder ? 'text-primary' : ''}
        >
          <Mic className="w-4 h-4 mr-2" />
          {showRecorder ? 'Hide Recorder' : 'Record Audio'}
        </Button>
      </div>

      {showRecorder && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDuration={600} // 10 minutes
        />
      )}

      {audioBlob && !showRecorder && (
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              ✅ Audio recorded ({Math.round(audioBlob.size / 1024)}KB)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioBlob(null)}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            placeholder="Give your audio post a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                #{tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              id="tags"
              placeholder="Add tags (press Enter or comma)"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              maxLength={30}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              disabled={!currentTag.trim() || tags.length >= 10}
            >
              <Hash className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tags.length}/10 tags
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacy">Privacy</Label>
          <Select value={privacy} onValueChange={(value: any) => setPrivacy(value)}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <PrivacyIcon className="w-4 h-4" />
                  <span>
                    {privacy === 'public' && 'Public'}
                    {privacy === 'connections_only' && 'Connections Only'}
                    {privacy === 'private' && 'Private'}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </div>
              </SelectItem>
              <SelectItem value="connections_only">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Connections Only</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!audioBlob || createPost.isPending}
        >
          {createPost.isPending ? 'Publishing...' : 'Publish Post'}
        </Button>
      </form>
    </div>
  );
}
