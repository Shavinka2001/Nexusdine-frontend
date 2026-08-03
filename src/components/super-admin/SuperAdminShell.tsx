"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/useAuthStore";

const NAV = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/plans", label: "Plans", icon: Package },
  { href: "/super-admin/whatsapp", label: "WhatsApp", icon: MessageSquare },
] as const;

function SuperAdminUserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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

  function onSignOut() {
    setOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1 text-[#2F3E46] transition hover:border-[#FF6B35]/40 hover:shadow-sm"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight">
            {user?.name || "SaaS Super Admin"}
          </span>
          <span className="block text-[11px] leading-tight text-slate-500">
            SaaS Super Admin
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mr-1 hidden h-4 w-4 text-slate-400 transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(100vw-2rem,16rem)] origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-panel transition duration-200",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="truncate text-xs text-slate-500">
            {user?.email || "admin@nexusdine.com"}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#FF6B35]">
            SaaS Super Admin
          </p>
        </div>

        <div className="my-1.5 h-px bg-slate-100" />

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

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B35]">
        <Shield className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-display text-lg leading-none text-white">
          Nexus<span className="text-[#FF6B35]">Dine</span>
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B35]">
          Super Admin
        </p>
      </div>
    </div>
  );
}

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50/50">
      {/* Desktop sticky sidebar */}
      <aside className="no-scrollbar sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/50 bg-[#2F3E46] text-white md:flex">
        <SidebarBrand />
        {navLinks}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          className={cn(
            "absolute inset-0 bg-[#2F3E46]/50 backdrop-blur-[2px] transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "no-scrollbar absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col overflow-y-auto bg-[#2F3E46] text-white shadow-panel transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B35]">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <p className="font-display text-lg text-white">
                Nexus<span className="text-[#FF6B35]">Dine</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {navLinks}
        </aside>
      </div>

      {/* Main column — alone scrolls */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-md md:h-16 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#2F3E46] transition hover:border-[#FF6B35]/40 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">
                Control plane
              </p>
              <p className="truncate text-sm font-semibold text-[#2F3E46] md:text-base">
                {user?.name ?? "SaaS Super Admin"}
              </p>
            </div>
          </div>

          <SuperAdminUserMenu />
        </header>

        <main className="flex-1 px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
