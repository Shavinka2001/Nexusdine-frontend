"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  normalizeRole,
  resolveAppRole,
  roleLabel,
  stationLabel,
} from "@/lib/roles";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { getNavForRole, type NavConfigItem } from "./nav-config";

interface SidebarProps {
  className?: string;
  /** Force visible (used inside mobile drawer) */
  forceShow?: boolean;
  onNavigate?: () => void;
}

function isNavItemActive(pathname: string, item: NavConfigItem) {
  if (item.path === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function Sidebar({ className, forceShow, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isOffline } = useOfflineStatus();
  const user = useAuthStore((s) => s.user);

  // Strict RBAC: unknown / missing role → no navigation links
  const appRole = resolveAppRole(user?.role);
  const navItems = getNavForRole(appRole);
  const displayRole = appRole ?? normalizeRole(user?.role);

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ND";

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#2F3E46] text-white",
        forceShow ? "flex" : "hidden md:flex",
        className,
      )}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <p className="font-display text-xl tracking-tight text-white">
          Nexus<span className="text-[#FF6B35]">Dine</span>
        </p>
        <p className="mt-0.5 text-[11px] text-white/50">
          {stationLabel(displayRole)}
        </p>
      </div>

      <nav
        aria-label="Primary"
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-2.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150",
                active
                  ? "bg-[#FF6B35] text-white shadow-sm shadow-[#FF6B35]/35"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={active ? 2.4 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isOffline ? (
        <div className="mx-2.5 mb-2 flex shrink-0 items-center gap-2 rounded-lg bg-amber-500/15 px-2.5 py-2 text-[11px] text-amber-200">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Offline — changes sync later
        </div>
      ) : null}

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {user?.name || "Staff"}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#FF6B35]/90">
                {appRole ? roleLabel(appRole) : "Unknown role"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
