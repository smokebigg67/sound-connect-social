import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, MessageCircle, Phone } from 'lucide-react';
import { connectionsAPI, contactAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Connection {
  _id: string;
  username: string;
  profile: {
    displayName?: string;
    avatar?: string;
    bio?: string;
  };
  connection: {
    id: string;
    connectedSince: string;
    requesterId: string;
  };
}

export default function ConnectionList() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: connections, isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsAPI.getFollowing().then(res => res.data)
  });

  const removeConnectionMutation = useMutation({
    mutationFn: (userId: string) => connectionsAPI.unfollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Connection removed');
    },
    onError: () => {
      toast.error('Failed to remove connection');
    }
  });

  const revealContactMutation = useMutation({
    mutationFn: (userId: string) => contactAPI.reveal(userId),
    onSuccess: () => {
      toast.success('Contact reveal request sent');
    },
    onError: () => {
      toast.error('Failed to send contact reveal request');
    }
  });

  const handleRemoveConnection = (userId: string, username: string) => {
    if (window.confirm(`Remove connection with ${username}?`)) {
      removeConnectionMutation.mutate(userId);
    }
  };

  const handleRevealContact = (userId: string) => {
    revealContactMutation.mutate(userId);
  };

  const filteredConnections = connections?.filter((connection: Connection) =>
    connection.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.profile.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Connections</h2>
        <span className="text-sm text-muted-foreground">
          {connections?.length || 0} connections
        </span>
      </div>

      <Input
        placeholder="Search connections..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {filteredConnections.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No connections found' : 'No connections yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConnections.map((connection: Connection) => {
            const displayName = connection.profile.displayName || connection.username;
            const connectedDate = new Date(connection.connection.connectedSince).toLocaleDateString();

            return (
              <div
                key={connection._id}
                className="bg-card rounded-lg border p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={connection.profile.avatar} />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-semibold">{displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      @{connection.username}
                    </p>
                    {connection.profile.bio && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {connection.profile.bio}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected since {connectedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevealContact(connection._id)}
                    disabled={revealContactMutation.isPending}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Reveal Contact
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveConnection(connection._id, connection.username)}
                    disabled={removeConnectionMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}