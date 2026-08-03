"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { normalizeRole, roleLabel } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

interface UserProfileMenuProps {
  immersive?: boolean;
}

export function UserProfileMenu({ immersive }: UserProfileMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const role = normalizeRole(user?.role);
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ND";

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onSignOut = () => {
    setOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-xl border px-1.5 py-1 transition",
          immersive
            ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
            : "border-slate-200 bg-white text-[#2F3E46] hover:border-[#FF6B35]/40 hover:shadow-sm",
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight">
            {user?.name || "Staff"}
          </span>
          <span
            className={cn(
              "block text-[11px] leading-tight",
              immersive ? "text-white/50" : "text-slate-400",
            )}
          >
            {roleLabel(role)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mr-1 hidden h-4 w-4 transition-transform sm:block",
            immersive ? "text-white/50" : "text-slate-400",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-64 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-panel transition duration-200",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="truncate text-sm font-semibold text-[#2F3E46]">
            {user?.name || "Staff"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {user?.email || "—"}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B35]">
            {roleLabel(role)}
          </p>
        </div>

        <div className="my-1.5 h-px bg-slate-100" />

        <Link
          href="/settings"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[#2F3E46] transition hover:bg-slate-50"
        >
          <User className="h-4 w-4 text-slate-400" />
          My Profile
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={onSignOut}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[#2F3E46] transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
