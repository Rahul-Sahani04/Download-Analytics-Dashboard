import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSettings, settingsService } from '@/services/settings-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    analyticsEnabled: false,
    autoDownloadEnabled: false
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    activityUpdates: false,
    newResourceAlerts: false
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: false,
    activityVisible: false,
    dataRetention: '6months'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getUserSettings();
      setSettings(data);
      
      // Update form state
      setName(data.name);
      setEmail(data.email);
      setPreferences({
        analyticsEnabled: data.analyticsEnabled,
        autoDownloadEnabled: data.autoDownloadEnabled
      });
      setNotifications({
        emailNotifications: data.emailNotifications,
        activityUpdates: data.activityUpdates,
        newResourceAlerts: data.newResourceAlerts
      });
      setPrivacy({
        publicProfile: data.publicProfile,
        activityVisible: data.activityVisible,
        dataRetention: data.dataRetention
      });
      
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await settingsService.updateProfile({ name, email });
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async (type: 'preferences' | 'notifications' | 'privacy') => {
    try {
      setSaving(true);
      let data = {};
      
      if (type === 'preferences') {
        data = { preferences };
      } else if (type === 'notifications') {
        data = { notifications };
      } else {
        data = { privacy };
      }

      await settingsService.updateSettings(data);
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Admin settings and preferences' : 'Manage your account settings and preferences'}
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isAdmin && <TabsTrigger value="privacy">Privacy</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={settings?.role === 'admin' ? 'Administrator' : 'Faculty'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Preferences</CardTitle>
                  <CardDescription>Configure administrative settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <Switch 
                      id="analytics"
                      checked={preferences.analyticsEnabled}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, analyticsEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="downloads">Auto-download Updates</Label>
                    <Switch 
                      id="downloads"
                      checked={preferences.autoDownloadEnabled}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, autoDownloadEnabled: checked }))
                      }
                    />
                  </div>
                  <Button onClick={() => handleUpdateSettings('preferences')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Admin Preferences'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="activity-updates">Activity Updates</Label>
                  <Switch 
                    id="activity-updates"
                    checked={notifications.activityUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, activityUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="new-resources">New Resources</Label>
                  <Switch 
                    id="new-resources"
                    checked={notifications.newResourceAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, newResourceAlerts: checked }))
                    }
                  />
                </div>
                <Button onClick={() => handleUpdateSettings('notifications')} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control system-wide privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="profile-visible">Public Profiles</Label>
                    <Switch 
                      id="profile-visible"
                      checked={privacy.publicProfile}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, publicProfile: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="activity-visible">Activity Tracking</Label>
                    <Switch 
                      id="activity-visible"
                      checked={privacy.activityVisible}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, activityVisible: checked }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="data-retention">Global Data Retention</Label>
                    <Select 
                      value={privacy.dataRetention}
                      onValueChange={(value) => 
                        setPrivacy(prev => ({ ...prev, dataRetention: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => handleUpdateSettings('privacy')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}