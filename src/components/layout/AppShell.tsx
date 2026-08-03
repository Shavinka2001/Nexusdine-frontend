"use client";

import { ReactNode, useState } from "react";
import { GuestRecoveryAlertPanel } from "@/components/features/alerts/GuestRecoveryAlertPanel";
import { WaiterServiceBellPanel } from "@/components/features/alerts/WaiterServiceBellPanel";
import { cn } from "@/lib/cn";
import { normalizeRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  /** Drop padded chrome for kitchen fullscreen boards */
  immersive?: boolean;
  /** Edge-to-edge main area for POS / kiosk layouts */
  flush?: boolean;
}

export function AppShell({
  children,
  title,
  immersive,
  flush,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(user?.role);
  const floorRole = role === "WAITER" || role === "CASHIER";

  return (
    <div
      className={cn(
        "flex min-h-screen",
        immersive ? "bg-[#1C252A]" : "bg-slate-50/50",
      )}
    >
      <Sidebar />

      {/* Mobile / tablet slide-out drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileNavOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "absolute inset-0 bg-[#2F3E46]/50 backdrop-blur-[2px] transition-opacity duration-300",
            mobileNavOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[min(100%,18rem)] transition-transform duration-300 ease-out",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar
            forceShow
            onNavigate={() => setMobileNavOpen(false)}
            className="h-full w-full shadow-panel"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          title={title}
          immersive={immersive}
          highlightMenu={floorRole}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main
          className={cn(
            "flex-1 overflow-y-auto",
            flush
              ? "overflow-hidden p-0 pb-0"
              : immersive
                ? "px-0 pb-0 pt-0 md:px-6 md:pb-6 md:pt-4 lg:px-8"
                : "px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6 lg:px-8",
            !flush && role === "CHEF" && "pb-4 md:pb-6",
          )}
        >
          <div className="w-full">{children}</div>
        </main>

        {flush ? null : <MobileBottomNav />}
      </div>

      <GuestRecoveryAlertPanel />
      <WaiterServiceBellPanel />
    </div>
  );
}
