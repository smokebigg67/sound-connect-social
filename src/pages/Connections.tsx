import Navigation from "@/components/layout/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserCheck, X, Check } from "lucide-react";

const Connections = () => {
  const pendingRequests = [
    {
      id: "1",
      name: "Sarah Johnson",
      username: "sarahvoice",
      avatar: "",
    },
    {
      id: "2",
      name: "Michael Brown",
      username: "mikesounds",
      avatar: "",
    },
  ];

  const connections = [
    {
      id: "1",
      name: "Alex Chen",
      username: "audioexplorer",
      avatar: "",
    },
    {
      id: "2",
      name: "Maria Rodriguez",
      username: "voiceartist",
      avatar: "",
    },
    {
      id: "3",
      name: "James Wilson",
      username: "soundwave",
      avatar: "",
    },
  ];

  const suggestions = [
    {
      id: "1",
      name: "Emma Davis",
      username: "emmatalks",
      avatar: "",
    },
    {
      id: "2",
      name: "David Lee",
      username: "davidaudio",
      avatar: "",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Connections</h1>
            <p className="text-muted-foreground">
              Manage your audio community
            </p>
          </div>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card">
              <TabsTrigger value="connections">My Connections</TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={connection.avatar} />
                          <AvatarFallback className="bg-gradient-audio text-white">
                            {connection.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{connection.name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{connection.username}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Connected
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={request.avatar} />
                            <AvatarFallback className="bg-gradient-audio text-white">
                              {request.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{request.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-gradient-audio hover:opacity-90"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button variant="outline" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border bg-card">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No pending connection requests
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={suggestion.avatar} />
                          <AvatarFallback className="bg-gradient-audio text-white">
                            {suggestion.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{suggestion.name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{suggestion.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-audio hover:opacity-90"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Connections;
