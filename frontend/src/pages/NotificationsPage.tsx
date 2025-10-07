import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  type: 'connection_request' | 'connection_accepted' | 'contact_reveal_request' | 'new_post' | 'post_like' | 'post_comment';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  // Mock data for now - replace with actual API calls
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => Promise.resolve({
      notifications: [
        {
          _id: '1',
          type: 'connection_request',
          title: 'New Connection Request',
          message: 'John Doe wants to connect with you',
          data: { userId: 'user1', username: 'johndoe' },
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          _id: '2',
          type: 'post_like',
          title: 'Post Liked',
          message: 'Sarah liked your audio post "Morning Thoughts"',
          data: { userId: 'user2', postId: 'post1' },
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          _id: '3',
          type: 'connection_accepted',
          title: 'Connection Accepted',
          message: 'Mike accepted your connection request',
          data: { userId: 'user3' },
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
      ] as Notification[]
    })
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      // Replace with actual API call
      Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      // Replace with actual API call
      Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => 
      // Replace with actual API call
      Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    }
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return '👥';
      case 'contact_reveal_request':
        return '📞';
      case 'new_post':
        return '🎙️';
      case 'post_like':
        return '❤️';
      case 'post_comment':
        return '💬';
      default:
        return '🔔';
    }
  };

  const filteredNotifications = notifications?.notifications?.filter((notification: Notification) => 
    filter === 'all' || !notification.read
  ) || [];

  const unreadCount = notifications?.notifications?.filter((n: Notification) => !n.read).length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your connections and activity
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Badge variant="destructive" className="h-6">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification: Notification) => (
            <div
              key={notification._id}
              className={`bg-card rounded-lg border p-4 ${
                !notification.read ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  
                  {!notification.read && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark as read
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(notification._id)}
                  disabled={deleteNotificationMutation.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}