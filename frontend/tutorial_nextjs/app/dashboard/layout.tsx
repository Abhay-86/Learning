"use client";

import { AuthGuard } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    User
} from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logoutUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Sidebar */}
                <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed h-screen">
                    {/* Logo/Brand */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold">A</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-sm">{user?.first_name || 'User'}</h2>
                                <p className="text-xs text-muted-foreground">{user?.role || 'USER'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Platform
                        </div>
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/dashboard')
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/dashboard/settings')
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/dashboard/profile')
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                    </nav>

                    {/* User Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => {
                                logoutUser();
                                router.push('/auth/login');
                            }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content - with left margin for sidebar */}
                <main className="flex-1 lg:ml-64 overflow-auto">
                    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-3xl font-bold">
                                    {pathname === '/dashboard' && 'Dashboard'}
                                    {pathname === '/dashboard/settings' && 'Settings'}
                                    {pathname === '/dashboard/profile' && 'Profile'}
                                </h1>
                                <div className="text-sm text-muted-foreground">
                                    Last updated: {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                {pathname === '/dashboard' && 'Monitor and manage your application features'}
                                {pathname === '/dashboard/settings' && 'Manage your account settings and preferences'}
                                {pathname === '/dashboard/profile' && 'View and update your profile information'}
                            </p>
                        </div>

                        {/* Page Content */}
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
