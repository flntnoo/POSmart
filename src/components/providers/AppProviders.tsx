"use client";

import { ReactNode } from "react";
import { SessionProvider } from "@/contexts/SessionContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
