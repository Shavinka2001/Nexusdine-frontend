"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface DrawerProps {
  open: boolean;
  title?: string;
  side?: "left" | "right";
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  title,
  side = "right",
  onClose,
  children,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Close drawer backdrop"
        className={cn(
          "absolute inset-0 bg-secondary-900/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute top-0 flex h-full w-[min(100%,22rem)] flex-col bg-surface-elevated shadow-panel transition-transform duration-300",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-secondary-100 px-4 py-3">
          {title ? (
            <h2 className="font-display text-lg text-secondary-900">{title}</h2>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
