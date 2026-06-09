import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { TelehealthUserProfile } from "@workspace/api-client-react";

interface TelehealthAuthContextType {
  token: string | null;
  user: TelehealthUserProfile | null;
  login: (token: string, user: TelehealthUserProfile) => void;
  logout: () => void;
  isSessionWarningOpen: boolean;
  closeSessionWarning: () => void;
  resetTimeout: () => void;
}

const TelehealthAuthContext = createContext<TelehealthAuthContextType | undefined>(undefined);

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 mins warning

export function TelehealthAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("telehealth_token"));
  const [user, setUser] = useState<TelehealthUserProfile | null>(() => {
    const stored = localStorage.getItem("telehealth_user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);
  const [, setLocation] = useLocation();

  const login = useCallback((newToken: string, newUser: TelehealthUserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("telehealth_token", newToken);
    localStorage.setItem("telehealth_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("telehealth_token");
    localStorage.removeItem("telehealth_user");
    setLocation("/telehealth/login");
  }, [setLocation]);

  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimeout = useCallback(() => {
    setLastActivity(Date.now());
    setIsSessionWarningOpen(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    const handleActivity = () => {
      resetTimeout();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [token, resetTimeout]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity >= SESSION_TIMEOUT_MS) {
        logout();
      } else if (timeSinceActivity >= SESSION_TIMEOUT_MS - WARNING_BEFORE_MS) {
        setIsSessionWarningOpen(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [token, lastActivity, logout]);

  return (
    <TelehealthAuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isSessionWarningOpen,
        closeSessionWarning: resetTimeout,
        resetTimeout
      }}
    >
      {children}
    </TelehealthAuthContext.Provider>
  );
}

export function useTelehealthAuth() {
  const context = useContext(TelehealthAuthContext);
  if (context === undefined) {
    throw new Error("useTelehealthAuth must be used within a TelehealthAuthProvider");
  }
  return context;
}
