"use client";

import { ReactNode, useEffect, useEffectEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Drop default padding — children manage their own scroll/footer layout */
  flush?: boolean;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
  flush,
}: ModalProps) {
  const handleEscape = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleEscape();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-secondary-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-surface-elevated shadow-panel",
          "animate-in slide-in-from-bottom md:rounded-2xl",
          flush
            ? "max-h-[95dvh] overflow-hidden p-0"
            : "max-h-[95dvh] overflow-y-auto p-5",
          className,
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3",
            flush ? "border-b border-slate-100 px-5 py-4" : "mb-4",
          )}
        >
          {title ? (
            <h2 className="font-display text-xl text-secondary-900">{title}</h2>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {flush ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
