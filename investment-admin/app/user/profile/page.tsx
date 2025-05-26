"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BadgeCheck,
  CalendarClock,
  UserCircle,
  Smartphone,
  Mail,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { getUser } from "@/lib/auth";
import { User } from "@/types/auth";

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Form submission states
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Get user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch profile data
        const response = await userApi.profile.getProfile();
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setUser(response.data.user);
          setDevices(response.data.devices || []);

          // Initialize form values
          setName(response.data.user.name);
          setPhone(response.data.user.phone);
          setProfilePicUrl(response.data.user.profile_pic_url || "");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profile data"
        );

        // Try to fall back to client-side user data
        const userData = getUser();
        if (userData) {
          setUser(userData);
          setName(userData.name);
          setPhone(userData.phone || "");
          setProfilePicUrl(userData.profile_pic_url || "");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userApi.profile.updateProfile({
        name,
        phone,
        profile_pic_url: profilePicUrl,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setUser(response.data.user);
        setSuccess("Profile updated successfully");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setPasswordSubmitting(false);
      return;
    }

    try {
      const response = await userApi.profile.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess("Password changed successfully");

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          variant="default"
          className="border-green-500 bg-green-50 dark:bg-green-950/30"
        >
          <AlertDescription className="text-green-700 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and update your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profile_pic_url} alt={user?.name} />
                  <AvatarFallback>
                    <UserCircle className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{user?.name}</h3>
                    {user?.is_kyc_verified && (
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3 mr-1" />
                    Joined {user ? formatDate(user.created_at) : "Loading..."}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePic">Profile Picture URL</Label>
                    <Input
                      id="profilePic"
                      placeholder="https://example.com/your-photo.jpg"
                      value={profilePicUrl}
                      onChange={(e) => setProfilePicUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={profileSubmitting}>
                    {profileSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Update your password and manage security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordSubmitting}>
                    {passwordSubmitting ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-2">Biometric Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enable biometric login for easier access on your devices
                </p>

                <Button
                  variant={user?.biometric_enabled ? "outline" : "default"}
                  onClick={async () => {
                    try {
                      await userApi.profile.enableBiometric();
                      setUser((prev) =>
                        prev ? { ...prev, biometric_enabled: true } : null
                      );
                      setSuccess("Biometric authentication enabled");
                    } catch (err) {
                      setError("Failed to enable biometric authentication");
                    }
                  }}
                  disabled={user?.biometric_enabled}
                >
                  {user?.biometric_enabled
                    ? "Biometric Enabled"
                    : "Enable Biometric"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>
                Manage devices that are registered to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 w-48 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No devices registered</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1.5">
                    Your registered devices will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {device.device_name || `Device #${device.id}`}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {device.device_model || device.device_id}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className={
                              device.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {device.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {device.last_login && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last used: {formatDate(device.last_login)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              For security reasons, you cannot remove devices from this
              interface. Please contact support if you need to remove a device.
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
