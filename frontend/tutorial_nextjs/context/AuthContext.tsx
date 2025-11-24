"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login, userProfile, refreshToken, logout, googleLogin } from "@/services/auth/authApi";
import { getUserFeatures } from "@/services/features/featureApi";
import { User, AuthContextType, LoginPayload, UserRole, UserFeature } from "@/types/types";
import { roleUtils } from "@/lib/roleUtils";
import { featureUtils } from "@/lib/featureUtils";


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<UserFeature[]>([]);
  // const [featuresLoading, setFeaturesLoading] = useState(true);


  // Fetch user profile on mount
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await userProfile();
        setUser(profile);
      } catch (error) {
        try {
          // Try refreshing if access token expired
          await refreshToken();
          const profile = await userProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (!user) {
        setFeatures([]);
        // setFeaturesLoading(false);
        return;
      }
      try {
        // setFeaturesLoading(true);
        const userFeatures = await getUserFeatures();
        console.log('Fetched features:', userFeatures);
        setFeatures(userFeatures);
      } catch (err) {
        console.error("Error fetching features:", err);
        setFeatures([]);
      } finally {
        // setFeaturesLoading(false);
      }
    };

    fetchFeatures();
  }, [user]);
  //   const loginUser = async (username: string, password: string) => {
  //     const loginPayload: LoginPayload = { username, password }; // create object
  //     const loggedInUser = await login(loginPayload); // pass it to API
  //     setUser(loggedInUser);
  //   };

  const loginUser = async (loginPayload: LoginPayload) => {
    const loggedInUser = await login(loginPayload);
    setUser(loggedInUser);
  };

  const loginWithGoogle = async (credential: string) => {
    const loggedInUser = await googleLogin(credential);
    setUser(loggedInUser);
  };


  const logoutUser = async () => {
    try {
      await logout(); // calls Django endpoint -> deletes cookies
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      setFeatures([]);
    }
  };

  // Role-based access methods
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return roleUtils.hasRole(user.role, role);
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    return roleUtils.isAdmin(user.role);
  };

  const isManager = (): boolean => {
    if (!user) return false;
    return roleUtils.isManagerOrAbove(user.role);
  };

  const canAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return roleUtils.canAccess(user.role, requiredRole);
  };

  const hasFeature = (featureCode: string): boolean => {
    return featureUtils.hasFeatureAccess(features, featureCode);
  };

  const hasAnyFeature = (featureCodes: string[]): boolean => {
    return featureUtils.hasAnyFeatureAccess(features, featureCodes);
  };

  const getActiveFeatures = (): UserFeature[] => {
    return featureUtils.getActiveFeatures(features);
  };
  const getAccessibleFeatureCodes = (): string[] => {
    return featureUtils.getAccessibleFeatureCodes(features);
  };

  const shouldRedirectToPayments = (featureCode: string): boolean => {
    const hasAccess = featureUtils.hasFeatureAccess(features, featureCode);
    return !hasAccess;
  };

  const getFeatureExpiryInfo = (featureCode: string): { hasFeature: boolean; isExpired: boolean; expiresOn: string | null } => {
    return featureUtils.getFeatureExpiryInfo(features, featureCode);
  };


  return (
    <AuthContext.Provider value={{
      user,
      features,
      loading,
      loginUser,
      loginWithGoogle,
      logoutUser,
      hasRole,
      isAdmin,
      isManager,
      canAccess,
      // Feature methods
      hasFeature,
      hasAnyFeature,
      getActiveFeatures,
      getAccessibleFeatureCodes,
      shouldRedirectToPayments,
      getFeatureExpiryInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
