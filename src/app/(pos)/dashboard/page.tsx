"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  CashierDashboard,
  OwnerDashboard,
  WaiterDashboard,
} from "@/components/features/dashboards";
import { normalizeRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(user?.role);

  useEffect(() => {
    if (role === "CHEF") {
      router.replace("/dashboard/kitchen");
    }
  }, [role, router]);

  if (role === "CHEF") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50/50 text-slate-500">
        <p className="text-sm">Opening kitchen display…</p>
      </div>
    );
  }

  const title =
    role === "WAITER" ? "Floor" : role === "CASHIER" ? "Cashier" : "Dashboard";

  return (
    <AppShell title={title}>
      {role === "OWNER" || role === "MANAGER" ? <OwnerDashboard /> : null}
      {role === "CASHIER" ? <CashierDashboard /> : null}
      {role === "WAITER" ? <WaiterDashboard /> : null}
    </AppShell>
  );
}
