"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/app/context/AuthContext";
import { UnifiedProvider } from "@/app/context/UnifiedContext";
import { NotificationProvider } from "@/app/context/NotificationContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <AuthProvider>
        <UnifiedProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </UnifiedProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
