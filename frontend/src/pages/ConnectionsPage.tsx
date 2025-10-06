import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { connectionsAPI } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ConnectionList from '@/components/social/ConnectionList';
import FriendRequest from '@/components/social/FriendRequest';

export default function ConnectionsPage() {
  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['connection-requests'],
    queryFn: () => connectionsAPI.getPendingRequests?.().then(res => res.data) || Promise.resolve([])
  });

  const { data: sentRequests, isLoading: sentLoading } = useQuery({
    queryKey: ['sent-requests'],
    queryFn: () => connectionsAPI.getSentRequests?.().then(res => res.data) || Promise.resolve([])
  });

  const pendingCount = pendingRequests?.requests?.length || 0;
  const sentCount = sentRequests?.requests?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground">
          Manage your connections and friend requests
        </p>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="relative">
            Sent
            {sentCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {sentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <ConnectionList />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <span className="text-sm text-muted-foreground">
              {pendingCount} pending
            </span>
          </div>

          {pendingLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : pendingCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests?.requests?.map((request: any) => (
                <FriendRequest
                  key={request._id}
                  request={request}
                  type="incoming"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sent Requests</h2>
            <span className="text-sm text-muted-foreground">
              {sentCount} sent
            </span>
          </div>

          {sentLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : sentCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests?.requests?.map((request: any) => (
                <FriendRequest
                  key={request._id}
                  request={request}
                  type="outgoing"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}