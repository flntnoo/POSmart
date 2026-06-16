"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { mockUsers } from "@/data/mockData";
import type { User, UserRole } from "@/types/posmart";

type SessionContextValue = {
  currentUser: User | null;
  currentRole: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginMock: (role?: UserRole) => void;
  logoutMock: () => void;
  setSessionUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function getUserForRole(role: UserRole) {
  return mockUsers.find((user) => user.role === role) ?? mockUsers[0];
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]);
  const [loading] = useState(false);

  const value = useMemo<SessionContextValue>(() => ({
    currentUser,
    currentRole: currentUser?.role ?? null,
    loading,
    isAuthenticated: Boolean(currentUser),
    loginMock: (role = "owner") => setCurrentUser(getUserForRole(role)),
    logoutMock: () => setCurrentUser(null),
    setSessionUser: (user) => setCurrentUser(user),
    switchRole: (role) => setCurrentUser(getUserForRole(role)),
  }), [currentUser, loading]);

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
