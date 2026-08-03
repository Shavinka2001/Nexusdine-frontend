"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { resolveAppRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const role = resolveAppRole(user?.role);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, user, role, pathname, router]);

  if (!hydrated || !isAuthenticated || !user || role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50/50 text-slate-500">
        <p className="text-sm">Verifying Super Admin access…</p>
      </div>
    );
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}
