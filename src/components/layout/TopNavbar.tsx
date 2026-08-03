"use client";

import { Menu, WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { cn } from "@/lib/cn";
import { UserProfileMenu } from "./UserProfileMenu";

interface TopNavbarProps {
  title?: string;
  immersive?: boolean;
  highlightMenu?: boolean;
  onOpenMobileNav: () => void;
}

export function TopNavbar({
  title,
  immersive,
  highlightMenu,
  onOpenMobileNav,
}: TopNavbarProps) {
  const { isOffline } = useOfflineStatus();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md md:px-6 lg:px-8",
        immersive
          ? "border-white/10 bg-[#1C252A]/90 text-white"
          : "border-slate-200/70 bg-white/90",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className={cn(
            "flex min-h-11 min-w-11 items-center justify-center rounded-xl border md:hidden",
            immersive
              ? "border-white/15 bg-white/5 text-white"
              : "border-slate-200 bg-white text-[#2F3E46]",
            highlightMenu && "ring-2 ring-[#FF6B35]/25",
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-lg md:hidden",
              immersive ? "text-white" : "text-[#2F3E46]",
            )}
          >
            Nexus<span className="text-[#FF6B35]">Dine</span>
          </p>
          {title ? (
            <h1
              className={cn(
                "truncate text-sm font-semibold md:text-base",
                immersive ? "text-white/90" : "text-[#2F3E46]",
              )}
            >
              {title}
            </h1>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isOffline ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </span>
        ) : null}

        <UserProfileMenu immersive={immersive} />
      </div>
    </header>
  );
}
