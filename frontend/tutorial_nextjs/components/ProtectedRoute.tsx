"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = "/auth/login",
  fallback = null,
}: ProtectedRouteProps) {
  const { user, loading, canAccess, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    let hasAccess = true;

    if (requiredRole) {
      hasAccess = canAccess(requiredRole);
    } else if (allowedRoles) {
      hasAccess = hasRole(allowedRoles);
    }

    if (!hasAccess) {
      // Redirect based on user role
      const roleRedirects = {
        USER: "/dashboard",
        MANAGER: "/manager",
        ADMIN: "/admin",
      };
      router.push(roleRedirects[user.role] || "/dashboard");
    }
  }, [user, loading, requiredRole, allowedRoles, canAccess, hasRole, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if no user
  if (!user) {
    return fallback;
  }

  // Check access
  let hasAccess = true;
  if (requiredRole) {
    hasAccess = canAccess(requiredRole);
  } else if (allowedRoles) {
    hasAccess = hasRole(allowedRoles);
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

// Specific role-based route components
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="ADMIN" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="MANAGER" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="USER" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Authentication guard (just needs to be logged in)
export function AuthGuard({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
}