import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Upload, Trash2, HardDrive, Cloud } from 'lucide-react';
import { usersAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [profile, setProfile] = useState({
    displayName: user?.profile?.displayName || '',
    bio: user?.profile?.bio || '',
    privateContact: user?.profile?.privateContact || ''
  });

  const [settings, setSettings] = useState({
    autoAcceptConnections: user?.settings?.autoAcceptConnections || false,
    contactRevealPolicy: user?.settings?.contactRevealPolicy || 'manual',
    notifications: {
      newConnection: user?.settings?.notifications?.newConnection ?? true,
      contactRequest: user?.settings?.notifications?.contactRequest ?? true,
      newPost: user?.settings?.notifications?.newPost ?? true
    }
  });

  const { data: storageInfo } = useQuery({
    queryKey: ['storage-info'],
    queryFn: () => usersAPI.getStorageInfo?.().then(res => res.data) || Promise.resolve(null)
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const connectGoogleDriveMutation = useMutation({
    mutationFn: () => authAPI.connectGoogleDrive?.() || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-info'] });
      toast.success('Google Drive connected successfully');
    },
    onError: () => {
      toast.error('Failed to connect Google Drive');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    updateProfileMutation.mutate(formData);
  };

  const handleConnectGoogleDrive = () => {
    // In a real implementation, this would redirect to Google OAuth
    window.open('/api/auth/google/url', '_blank');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profile?.avatar} />
                <AvatarFallback className="text-lg">
                  {(profile.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Avatar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Your display name"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {profile.bio.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateContact">Private Contact</Label>
                <Input
                  id="privateContact"
                  type="email"
                  value={profile.privateContact}
                  onChange={(e) => setProfile({ ...profile, privateContact: e.target.value })}
                  placeholder="email@example.com or phone number"
                />
                <p className="text-xs text-muted-foreground">
                  This will only be shared when you accept contact reveal requests
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-accept connections</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically accept all connection requests
                </p>
              </div>
              <Switch
                checked={settings.autoAcceptConnections}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoAcceptConnections: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Contact reveal policy</Label>
              <Select
                value={settings.contactRevealPolicy}
                onValueChange={(value) =>
                  setSettings({ ...settings, contactRevealPolicy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual approval required</SelectItem>
                  <SelectItem value="auto_connected">Auto-reveal to connections</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How your contact information is shared with others
              </p>
            </div>
          </div>

          <Button
            onClick={handleProfileSubmit}
            disabled={updateProfileMutation.isPending}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Privacy Settings
          </Button>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New connections</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone connects with you
                </p>
              </div>
              <Switch
                checked={settings.notifications.newConnection}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, newConnection: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Contact requests</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about contact reveal requests
                </p>
              </div>
              <Switch
                checked={settings.notifications.contactRequest}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, contactRequest: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New posts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when connections share new posts
                </p>
              </div>
              <Switch
                checked={settings.notifications.newPost}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, newPost: checked }
                  })
                }
              />
            </div>
          </div>

          <Button
            onClick={handleProfileSubmit}
            disabled={updateProfileMutation.isPending}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Notification Settings
          </Button>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Google Drive Storage</h3>
                {storageInfo?.storage?.connected ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <Cloud className="w-4 h-4 mr-1" />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Cloud className="w-4 h-4 mr-1" />
                    Not connected
                  </div>
                )}
              </div>

              {storageInfo?.storage?.connected && storageInfo?.storage?.quota ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{formatBytes(storageInfo.storage.quota.used)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Available</span>
                    <span>{formatBytes(storageInfo.storage.quota.available)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(storageInfo.storage.quota.used / storageInfo.storage.quota.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect your Google Drive to store audio files in the cloud
                </p>
              )}

              <Button
                onClick={handleConnectGoogleDrive}
                disabled={connectGoogleDriveMutation.isPending}
                variant={storageInfo?.storage?.connected ? "outline" : "default"}
                className="w-full"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {storageInfo?.storage?.connected ? 'Reconnect' : 'Connect'} Google Drive
              </Button>
            </div>

            <div className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Local Device Storage</h3>
                <div className="flex items-center text-muted-foreground text-sm">
                  <HardDrive className="w-4 h-4 mr-1" />
                  Fallback
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Audio files will be stored locally on your device as a fallback option
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}