import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export interface VolUser {
  id: number;
  email: string;
  name: string;
  role: "volunteer" | "coordinator";
  status: "pending" | "active" | "inactive";
  avatarInitials?: string | null;
  skills?: string | null;
  availability?: string | null;
  bio?: string | null;
}

interface VolAuthContextType {
  token: string | null;
  user: VolUser | null;
  login: (token: string, user: VolUser) => void;
  logout: () => void;
  isCoordinator: boolean;
}

const VolunteerAuthContext = createContext<VolAuthContextType | undefined>(undefined);

export function VolunteerAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vol_token"));
  const [user, setUser] = useState<VolUser | null>(() => {
    const stored = localStorage.getItem("vol_user");
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const [, setLocation] = useLocation();

  const login = useCallback((newToken: string, newUser: VolUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("vol_token", newToken);
    localStorage.setItem("vol_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    const t = localStorage.getItem("vol_token");
    if (t) {
      fetch("/api/volunteers/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("vol_token");
    localStorage.removeItem("vol_user");
    setLocation("/volunteers/login");
  }, [setLocation]);

  const isCoordinator = user?.role === "coordinator";

  return (
    <VolunteerAuthContext.Provider value={{ token, user, login, logout, isCoordinator }}>
      {children}
    </VolunteerAuthContext.Provider>
  );
}

export function useVolAuth() {
  const ctx = useContext(VolunteerAuthContext);
  if (!ctx) throw new Error("useVolAuth must be inside VolunteerAuthProvider");
  return ctx;
}
