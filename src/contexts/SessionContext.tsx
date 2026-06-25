"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import type { User, UserRole } from "@/types/posmart";

type SessionContextValue = {
  currentUser: User | null;
  currentRole: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginAsDemoRole: (role?: UserRole) => void;
  logout: () => Promise<void>;
  loginMock: (role?: UserRole) => void;
  logoutMock: () => void;
  setSessionUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  refreshSession: () => Promise<User | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const demoCredentials: Record<UserRole, { email: string; password: string }> = {
  owner: { email: "owner@posmart.test", password: "password123" },
  admin: { email: "admin@posmart.test", password: "password123" },
  kasir: { email: "kasir@posmart.test", password: "password123" },
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const response = await authService.session();
    const user = response.success && response.data ? response.data : null;
    setCurrentUser(user);
    setLoading(false);
    return user;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshSession();
    });
  }, [refreshSession]);

  const loginAsDemoRole = useCallback((role: UserRole = "owner") => {
    void authService.login({ ...demoCredentials[role], role }).then((response) => {
      if (response.success && response.data) setCurrentUser(response.data);
    });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().finally(() => setCurrentUser(null));
  }, []);

  const loginMock = loginAsDemoRole;
  const logoutMock = useCallback(() => {
    void logout();
  }, [logout]);

  const switchRole = useCallback((role: UserRole) => {
    loginAsDemoRole(role);
  }, [loginAsDemoRole]);

  const value = useMemo<SessionContextValue>(() => ({
    currentUser,
    currentRole: currentUser?.role ?? null,
    loading,
    isAuthenticated: Boolean(currentUser),
    loginAsDemoRole,
    logout,
    loginMock,
    logoutMock,
    setSessionUser: setCurrentUser,
    switchRole,
    refreshSession,
  }), [currentUser, loading, loginAsDemoRole, loginMock, logout, logoutMock, refreshSession, switchRole]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
