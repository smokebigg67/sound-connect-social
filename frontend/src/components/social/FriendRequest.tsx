import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock } from 'lucide-react';
import { connectionsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionRequest {
  _id: string;
  requesterId: {
    _id: string;
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
      bio?: string;
    };
  };
  message?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface FriendRequestProps {
  request: ConnectionRequest;
  type: 'incoming' | 'outgoing';
}

export default function FriendRequest({ request, type }: FriendRequestProps) {
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) =>
      connectionsAPI.respondToRequest?.(requestId, status) || Promise.resolve(),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success(status === 'accepted' ? 'Connection accepted!' : 'Request declined');
    },
    onError: () => {
      toast.error('Failed to respond to request');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) =>
      connectionsAPI.cancelRequest?.(requestId) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
      toast.success('Request cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel request');
    }
  });

  const handleAccept = () => {
    respondMutation.mutate({ requestId: request._id, status: 'accepted' });
  };

  const handleReject = () => {
    respondMutation.mutate({ requestId: request._id, status: 'rejected' });
  };

  const handleCancel = () => {
    if (window.confirm('Cancel this connection request?')) {
      cancelMutation.mutate(request._id);
    }
  };

  const displayName = request.requesterId.profile.displayName || request.requesterId.username;
  const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-start space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={request.requesterId.profile.avatar} />
          <AvatarFallback>
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{displayName}</h3>
              <p className="text-sm text-muted-foreground">
                @{request.requesterId.username}
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {request.requesterId.profile.bio && (
            <p className="text-sm text-muted-foreground mt-1">
              {request.requesterId.profile.bio}
            </p>
          )}

          {request.message && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <p className="italic">"{request.message}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {type === 'incoming' && request.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={respondMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={respondMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </>
        )}

        {type === 'outgoing' && request.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Request
          </Button>
        )}

        {request.status === 'accepted' && (
          <div className="flex items-center text-green-600 text-sm">
            <Check className="w-4 h-4 mr-1" />
            Connected
          </div>
        )}

        {request.status === 'rejected' && (
          <div className="flex items-center text-red-600 text-sm">
            <X className="w-4 h-4 mr-1" />
            Declined
          </div>
        )}
      </div>
    </div>
  );
}