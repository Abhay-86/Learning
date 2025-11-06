"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login, userProfile, refreshToken, logout } from "@/services/auth/authApi";
import { User, AuthContextType, LoginPayload } from "@/types/types";


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  

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

//   const loginUser = async (username: string, password: string) => {
//     const loginPayload: LoginPayload = { username, password }; // create object
//     const loggedInUser = await login(loginPayload); // pass it to API
//     setUser(loggedInUser);
//   };

    const loginUser = async (loginPayload: LoginPayload) => {
        const loggedInUser = await login(loginPayload);
        setUser(loggedInUser);
    };


  const logoutUser = async () => {
    try {
      await logout(); // calls Django endpoint -> deletes cookies
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
    }
  };

return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
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
