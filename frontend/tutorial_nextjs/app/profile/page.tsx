"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userProfile } from "@/services/auth/authApi";
import { User } from "@/types/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(!authUser);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      userProfile()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) return <p className="text-center py-8">Loading profile...</p>;
  if (!user) return <p className="text-center py-8">User not found.</p>;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information. All authenticated users can access this page.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p>{user.role}</p>
              </div>
              {user.phone_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{user.phone_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
                <p className="text-green-600">✓ Verified</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Two-Factor Auth</p>
                <p className="text-orange-600">⚠ Not Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
