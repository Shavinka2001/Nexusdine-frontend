"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomeRouteForRole } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/useAuthStore";

/** Root entry — send users to login or role home */
export default function RootPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && user) {
      router.replace(getHomeRouteForRole(user.role));
    } else {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <p className="font-display text-xl text-[#2F3E46]">
        Nexus<span className="text-[#FF6B35]">Dine</span>
      </p>
    </div>
  );
}
