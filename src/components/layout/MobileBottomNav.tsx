"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { resolveAppRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { getMobileNavForRole } from "./nav-config";

export function MobileBottomNav() {
  const pathname = usePathname();
  const role = resolveAppRole(useAuthStore((s) => s.user?.role));
  const items = getMobileNavForRole(role);

  // Chefs get a denser kitchen board — no bottom nav chrome
  if (!role || role === "CHEF") {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-[#2F3E46] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.path === "/dashboard"
            ? pathname.startsWith("/dashboard")
            : pathname.startsWith(item.path);
        const isOrder = item.id === "order";

        return (
          <Link
            key={item.id}
            href={item.path}
            className={cn(
              "relative flex h-full min-w-[4.5rem] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium transition-all duration-200",
              active ? "text-white" : "text-white/45",
              isOrder && "-mt-4",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-xl transition-all duration-200",
                isOrder &&
                  "h-12 w-12 rounded-full bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/35",
                !isOrder && "h-9 w-9",
                active &&
                  !isOrder &&
                  "bg-[#FF6B35] text-white shadow-sm shadow-[#FF6B35]/30",
              )}
            >
              <Icon
                className={cn(isOrder ? "h-6 w-6" : "h-5 w-5")}
                strokeWidth={active ? 2.4 : 2}
              />
            </span>
            {!isOrder ? (
              <span className={cn(active && "text-[#FF6B35]")}>{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
