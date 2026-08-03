"use client";

import { useEffect, useRef, useState } from "react";
import {
  Gift,
  Loader2,
  Percent,
  Phone,
  Star,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { fetchCustomers, searchCustomerByPhone } from "@/lib/crm-api";
import { fetchStaff, fetchStaffDiscountConfig } from "@/lib/staff-api";
import { cn } from "@/lib/cn";
import { selectCartTotals, useCartStore } from "@/store/useCartStore";
import type { Customer } from "@/types/crm";
import type { StaffMember } from "@/types/staff";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function roleLabel(role: string) {
  if (role === "KITCHEN") return "Chef";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const actionBtnClass =
  "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#2F3E46] transition-colors hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100";

/** Horizontal Add Guest / Staff Meal controls under the service toggle. */
export function CartQuickActionsBar() {
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const staffRecipientId = useCartStore((s) => s.staffRecipientId);
  const staffDiscountConfig = useCartStore((s) => s.staffDiscountConfig);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const setStaffRecipient = useCartStore((s) => s.setStaffRecipient);
  const setStaffDiscountConfig = useCartStore((s) => s.setStaffDiscountConfig);

  const [guestOpen, setGuestOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const [phone, setPhone] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestSeq = useRef(0);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStaffLoading(true);
      try {
        const [list, config] = await Promise.all([
          fetchStaff(),
          fetchStaffDiscountConfig(),
        ]);
        if (cancelled) return;
        setStaff(list);
        setStaffDiscountConfig(config);
      } catch {
        if (!cancelled) {
          setStaffDiscountConfig({
            staffDiscountPercentage: 0.5,
            maxPerDay: 1,
            isActive: false,
          });
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setStaffDiscountConfig]);

  useEffect(() => {
    if (!guestOpen) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const q = phone.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      setNotFound(false);
      return;
    }

    setSearching(true);
    const seq = ++requestSeq.current;

    debounceRef.current = window.setTimeout(async () => {
      try {
        let results = await fetchCustomers(q);
        if (results.length === 0) {
          try {
            const exact = await searchCustomerByPhone(q);
            results = [exact];
          } catch {
            // 404 — no match
          }
        }
        if (seq !== requestSeq.current) return;
        setSuggestions(results.slice(0, 5));
        setNotFound(results.length === 0);
      } catch {
        if (seq !== requestSeq.current) return;
        setSuggestions([]);
        setNotFound(true);
      } finally {
        if (seq === requestSeq.current) setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [phone, guestOpen]);

  const selectCustomer = (customer: Customer) => {
    setCustomer(customer);
    setPhone("");
    setSuggestions([]);
    setNotFound(false);
    setGuestOpen(false);
  };

  const pctLabel = Math.round(
    ((staffDiscountConfig?.staffDiscountPercentage ?? 0.5) || 0.5) * 100,
  );
  const staffMealsEnabled = !staffDiscountConfig || staffDiscountConfig.isActive;

  const showGuestBtn = !selectedCustomer;
  const showStaffBtn = staffMealsEnabled && !staffRecipientId;

  if (!showGuestBtn && !showStaffBtn) return null;

  return (
    <div className="mt-4 mb-4 flex h-11 w-full gap-2">
      {showGuestBtn ? (
        <Popover open={guestOpen} onOpenChange={setGuestOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={actionBtnClass}>
              <UserPlus className="h-4 w-4 text-[#FF6B35]" />
              Add Guest
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(18rem,calc(100vw-2rem))] p-3"
            align="start"
          >
            <PopoverHeader title="Find customer" />
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d+ ]/g, ""))
                }
                inputMode="tel"
                placeholder="Customer phone…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm font-semibold text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              {searching ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#FF6B35]" />
              ) : null}
            </div>

            {phone.trim().length >= 3 ? (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="flex min-h-12 w-full items-center gap-2 border-b border-slate-100 px-2.5 py-2 text-left last:border-b-0 hover:bg-orange-50/60 active:bg-orange-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserRound className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#2F3E46]">
                        {c.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {c.phone}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      {c.loyaltyPoints.toLocaleString()}
                    </span>
                  </button>
                ))}
                {notFound && !searching ? (
                  <p className="px-3 py-3 text-center text-xs text-slate-400">
                    No customer found
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">
                Type at least 3 digits to search
              </p>
            )}
          </PopoverContent>
        </Popover>
      ) : null}

      {showStaffBtn ? (
        <Popover open={staffOpen} onOpenChange={setStaffOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={actionBtnClass}>
              <Percent className="h-4 w-4 text-[#FF6B35]" />
              Staff Meal
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(18rem,calc(100vw-2rem))] p-2"
            align="end"
          >
            <PopoverHeader title="Select employee" />
            {staffLoading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              </div>
            ) : staff.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">
                No active staff found
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {staff.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`.trim();
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setStaffRecipient({ id: member.id, name });
                        setStaffOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left hover:bg-orange-50 active:bg-orange-100"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm">
                        👔
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#2F3E46]">
                          {name}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {roleLabel(member.role)} · {pctLabel}% off
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

/** Compact active guest / staff-meal badges above the cart item list. */
export function CartActiveBadges() {
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const redeemLoyaltyPoints = useCartStore((s) => s.redeemLoyaltyPoints);
  const loyaltyConfig = useCartStore(useShallow((s) => s.loyaltyConfig));
  const staffRecipientId = useCartStore((s) => s.staffRecipientId);
  const staffRecipientName = useCartStore((s) => s.staffRecipientName);
  const staffDiscountConfig = useCartStore((s) => s.staffDiscountConfig);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const toggleLoyaltyRedemption = useCartStore((s) => s.toggleLoyaltyRedemption);
  const setStaffRecipient = useCartStore((s) => s.setStaffRecipient);

  const { baseGrandTotal, loyaltyPointsUsed, loyaltyDiscount } = useCartStore(
    useShallow((s) => {
      const t = selectCartTotals(s);
      return {
        baseGrandTotal: t.baseGrandTotal,
        loyaltyPointsUsed: t.loyaltyPointsUsed,
        loyaltyDiscount: t.loyaltyDiscount,
      };
    }),
  );

  const pctLabel = Math.round(
    ((staffDiscountConfig?.staffDiscountPercentage ?? 0.5) || 0.5) * 100,
  );

  const canRedeem =
    Boolean(selectedCustomer) &&
    Boolean(loyaltyConfig?.isActive) &&
    (selectedCustomer?.loyaltyPoints ?? 0) > 0 &&
    baseGrandTotal > 0;

  const previewPoints =
    selectedCustomer &&
    loyaltyConfig?.isActive &&
    loyaltyConfig.valuePerPoint > 0
      ? Math.min(
          selectedCustomer.loyaltyPoints,
          baseGrandTotal > 0
            ? Math.floor(baseGrandTotal / loyaltyConfig.valuePerPoint)
            : 0,
        )
      : 0;

  if (!selectedCustomer && !staffRecipientId && !canRedeem) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {selectedCustomer ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs font-semibold text-[#2F3E46]">
          <span aria-hidden>👤</span>
          <span className="max-w-[7.5rem] truncate">{selectedCustomer.name}</span>
          <span className="text-slate-500">
            ({selectedCustomer.loyaltyPoints.toLocaleString()} pts)
          </span>
          <button
            type="button"
            aria-label="Remove guest"
            onClick={() => setCustomer(null)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {staffRecipientId ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 py-1 pl-2 pr-1 text-xs font-semibold text-[#FF6B35]">
          <span aria-hidden>👔</span>
          <span className="max-w-[7.5rem] truncate">
            {staffRecipientName || "Staff meal"}
          </span>
          <span>({pctLabel}% Off)</span>
          <button
            type="button"
            aria-label="Remove staff meal"
            onClick={() => setStaffRecipient(null)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-orange-400 hover:bg-orange-100 hover:text-orange-700"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {canRedeem ? (
        <button
          type="button"
          onClick={toggleLoyaltyRedemption}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold transition-colors",
            redeemLoyaltyPoints
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <Gift className="h-3 w-3" />
          {redeemLoyaltyPoints
            ? `−${formatLkr(loyaltyDiscount)}`
            : `Redeem ${previewPoints.toLocaleString()} pts`}
          {redeemLoyaltyPoints && loyaltyPointsUsed > 0 ? (
            <span className="font-medium opacity-70">
              · {loyaltyPointsUsed.toLocaleString()} pts
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
