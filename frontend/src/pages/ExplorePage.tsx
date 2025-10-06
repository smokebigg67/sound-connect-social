import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { usersAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => usersAPI.search(searchQuery).then(res => res.data),
    enabled: searchQuery.length > 0
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {users && (
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user._id} className="p-4 bg-card rounded-lg border">
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
