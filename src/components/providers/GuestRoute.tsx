"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomeRouteForRole } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/useAuthStore";

interface GuestRouteProps {
  children: ReactNode;
}

/** Redirects authenticated users away from login/register */
export function GuestRoute({ children }: GuestRouteProps) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && user) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <p className="text-sm text-secondary-400">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null;
  }

  return children;
}
