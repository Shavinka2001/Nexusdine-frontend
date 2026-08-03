"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Droplets,
  HandHelping,
  Loader2,
  Receipt,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { WaiterRequestType } from "@/hooks/useTableSession";

const ACTIONS: {
  type: WaiterRequestType;
  label: string;
  hint: string;
  icon: typeof Droplets;
  tone: string;
}[] = [
  {
    type: "REQUEST_WATER",
    label: "Request Water",
    hint: "Fresh water for the table",
    icon: Droplets,
    tone: "border-sky-200 bg-sky-50 text-sky-800",
  },
  {
    type: "BRING_CUTLERY",
    label: "Bring Cutlery",
    hint: "Extra spoons, forks, or napkins",
    icon: Utensils,
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    type: "CASH_PAYMENT",
    label: "Bill Please",
    hint: "Ready to settle the check",
    icon: Receipt,
    tone: "border-orange-200 bg-[#FFF3EE] text-[#FF6B35]",
  },
  {
    type: "GENERAL_HELP",
    label: "Help",
    hint: "Anything else you need",
    icon: HandHelping,
    tone: "border-slate-200 bg-slate-50 text-[#2F3E46]",
  },
];

interface CallStaffDrawerProps {
  open: boolean;
  onClose: () => void;
  onRequest: (type: WaiterRequestType) => Promise<string>;
}

export function CallStaffDrawer({
  open,
  onClose,
  onRequest,
}: CallStaffDrawerProps) {
  const [busy, setBusy] = useState<WaiterRequestType | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAction = async (type: WaiterRequestType) => {
    if (busy) return;
    setBusy(type);
    setError(null);
    try {
      const message = await onRequest(type);
      setConfirmed(message);
    } catch (err) {
      setConfirmed(null);
      setError(err instanceof Error ? err.message : "Could not notify staff");
    } finally {
      setBusy(null);
    }
  };

  const handleClose = () => {
    setConfirmed(null);
    setError(null);
    setBusy(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#2F3E46]/40 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close"
        className="flex-1"
        onClick={handleClose}
      />
      <div className="mx-auto w-full max-w-lg animate-fade-up rounded-t-3xl bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3EE] text-[#FF6B35]">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl text-[#2F3E46]">Call Staff</h2>
              <p className="text-xs text-slate-500">
                We’ll ping a waiter at your table
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 active:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <p className="font-display text-xl text-[#2F3E46]">On the way</p>
            <p className="max-w-sm text-sm text-slate-600">{confirmed}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-[#2F3E46] font-bold text-white active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {error ? (
              <p className="col-span-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : null}
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isBusy = busy === action.type;
              return (
                <button
                  key={action.type}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void handleAction(action.type)}
                  className={cn(
                    "flex min-h-[5.5rem] flex-col items-start justify-center gap-1 rounded-2xl border-2 p-4 text-left transition-none active:scale-[0.98] disabled:opacity-60",
                    action.tone,
                  )}
                >
                  <span className="flex items-center gap-2 text-base font-bold">
                    {isBusy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    {action.label}
                  </span>
                  <span className="text-xs font-medium opacity-80">
                    {action.hint}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
