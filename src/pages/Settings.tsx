import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Eye, 
  Trash2, 
  Download,
  Moon,
  Sun,
  Globe,
  Mail,
  MessageSquare,
  Calendar
} from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    interviews: true,
    messages: false,
    updates: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true
  });

  const [theme, setTheme] = useState("system");

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account preferences and privacy settings
            </p>
          </div>

          <div className="max-w-4xl">
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="John" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="john.doe@email.com" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <Button>Save Changes</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.email}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, email: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications in browser
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.push}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, push: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Interview Reminders</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified about upcoming interviews
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.interviews}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, interviews: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Messages from Recruiters</p>
                          <p className="text-sm text-muted-foreground">
                            Notifications when recruiters message you
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.messages}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, messages: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Platform Updates</p>
                          <p className="text-sm text-muted-foreground">
                            News about new features and updates
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={notifications.updates}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, updates: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Email Digest Frequency</Label>
                        <Select defaultValue="weekly">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Profile Visibility</p>
                          <p className="text-sm text-muted-foreground">
                            Make your profile visible to recruiters
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={privacy.profileVisible}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, profileVisible: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Show Email Address</p>
                          <p className="text-sm text-muted-foreground">
                            Display email on your public profile
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={privacy.showEmail}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, showEmail: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Allow Direct Messages</p>
                          <p className="text-sm text-muted-foreground">
                            Let recruiters send you direct messages
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={privacy.allowMessages}
                        onCheckedChange={(checked) => 
                          setPrivacy(prev => ({ ...prev, allowMessages: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Sharing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Analytics & Improvement</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Help us improve the platform by sharing anonymous usage data
                        </p>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <SettingsIcon className="w-4 h-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Timezone</Label>
                      <Select defaultValue="pst">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pst">Pacific Standard Time</SelectItem>
                          <SelectItem value="est">Eastern Standard Time</SelectItem>
                          <SelectItem value="cst">Central Standard Time</SelectItem>
                          <SelectItem value="mst">Mountain Standard Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Export Your Data</p>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of all your data
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                      <div>
                        <p className="font-medium text-destructive">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Storage Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Resume Files</span>
                          <span>2.4 MB / 50 MB</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className="h-full w-[5%] bg-secondary rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Profile Data</span>
                          <span>156 KB / 10 MB</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className="h-full w-[2%] bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;