"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  getHomeRouteForRole,
} from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/useAuthStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessPath(user.role, pathname)) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [hydrated, isAuthenticated, user, pathname, router]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking session…</p>
      </div>
    );
  }

  if (!canAccessPath(user.role, pathname)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-slate-50 px-6 text-center">
        <p className="font-display text-2xl text-[#2F3E46]">Unauthorized</p>
        <p className="text-sm text-slate-500">
          Your role ({user.role}) cannot access this page.
        </p>
      </div>
    );
  }

  return children;
}
