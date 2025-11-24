"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Shield,
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Edit
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{user.role}</Badge>
                  {user.is_verified ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p>{user.first_name} {user.last_name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{user.phone_number || 'Not provided'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Summary */}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Wallet Overview
            </CardTitle>
            <CardDescription>Your coin balance and transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.coin_balance}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                </div>
                <p className="font-semibold text-green-600">{user.total_coins_earned}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                </div>
                <p className="font-semibold text-orange-600">{user.total_coins_spent}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Money Spent</span>
                </div>
                <p className="font-semibold text-purple-600">₹{user.total_money_spent}</p>
              </div>
            </div>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/payments">
                <Coins className="mr-2 h-4 w-4" />
                Buy More Coins
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account preferences and security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email Verification</p>
              {user.is_verified ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                  <Button variant="outline" size="sm">Verify Email</Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Two-Factor Auth</p>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Not Enabled
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Actions</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </Button>
                <Button variant="outline" size="sm">Change Password</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
