"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, Loader2, Phone, Star, UserRound, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { fetchCustomers, searchCustomerByPhone } from "@/lib/crm-api";
import { cn } from "@/lib/cn";
import { selectCartTotals, useCartStore } from "@/store/useCartStore";
import type { Customer } from "@/types/crm";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * CRM phone-lookup panel shown at the top of the POS cart.
 * Type a phone number → live suggestions → tap to bind the customer
 * to the current bill and optionally redeem loyalty points.
 */
export function CustomerSelect() {
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const redeemLoyaltyPoints = useCartStore((s) => s.redeemLoyaltyPoints);
  const loyaltyConfig = useCartStore(useShallow((s) => s.loyaltyConfig));
  const setCustomer = useCartStore((s) => s.setCustomer);
  const toggleLoyaltyRedemption = useCartStore(
    (s) => s.toggleLoyaltyRedemption,
  );
  const { loyaltyPointsUsed, loyaltyDiscount, baseGrandTotal } = useCartStore(
    useShallow((s) => {
      const t = selectCartTotals(s);
      return {
        loyaltyPointsUsed: t.loyaltyPointsUsed,
        loyaltyDiscount: t.loyaltyDiscount,
        baseGrandTotal: t.baseGrandTotal,
      };
    }),
  );

  const [phone, setPhone] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestSeq = useRef(0);

  // Debounced live lookup while the cashier types the phone number
  useEffect(() => {
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
        // Partial match against name/phone; exact phone lookup as a fallback
        let results = await fetchCustomers(q);
        if (results.length === 0) {
          try {
            const exact = await searchCustomerByPhone(q);
            results = [exact];
          } catch {
            // 404 → genuinely no customer for this phone
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
  }, [phone]);

  const selectCustomer = (customer: Customer) => {
    setCustomer(customer);
    setPhone("");
    setSuggestions([]);
    setNotFound(false);
  };

  // Redemption preview when the toggle is off (what the customer *could* save)
  const previewPoints =
    selectedCustomer && loyaltyConfig?.isActive && loyaltyConfig.valuePerPoint > 0
      ? Math.min(
          selectedCustomer.loyaltyPoints,
          baseGrandTotal > 0
            ? Math.floor(baseGrandTotal / loyaltyConfig.valuePerPoint)
            : 0,
        )
      : 0;
  const previewDiscount =
    previewPoints * (loyaltyConfig?.valuePerPoint ?? 0);

  if (selectedCustomer) {
    const canRedeem =
      Boolean(loyaltyConfig?.isActive) &&
      selectedCustomer.loyaltyPoints > 0 &&
      baseGrandTotal > 0;

    return (
      <div className="border-b border-slate-200 bg-gradient-to-br from-[#FF6B35]/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/15 text-[#FF6B35]">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#2F3E46]">
              {selectedCustomer.name}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{selectedCustomer.phone}</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {selectedCustomer.loyaltyPoints.toLocaleString()} pts
              </span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove customer"
            onClick={() => setCustomer(null)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {canRedeem ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={redeemLoyaltyPoints}
            onClick={toggleLoyaltyRedemption}
            className={cn(
              "mt-3 flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-none active:scale-[0.99]",
              redeemLoyaltyPoints
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                redeemLoyaltyPoints
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 bg-white",
              )}
            >
              {redeemLoyaltyPoints ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
            <Gift
              className={cn(
                "h-4 w-4 shrink-0",
                redeemLoyaltyPoints ? "text-emerald-600" : "text-slate-400",
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                redeemLoyaltyPoints ? "text-emerald-700" : "text-[#2F3E46]",
              )}
            >
              {redeemLoyaltyPoints
                ? `Redeeming ${loyaltyPointsUsed.toLocaleString()} pts (−${formatLkr(loyaltyDiscount)})`
                : `Redeem ${previewPoints.toLocaleString()} pts (${formatLkr(previewDiscount)} off)`}
            </span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative border-b border-slate-200 px-4 py-3">
      <div className="relative">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
          inputMode="tel"
          placeholder="Customer phone…"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm font-semibold text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
        />
        {searching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#FF6B35]" />
        ) : null}
      </div>

      {phone.trim().length >= 3 && (suggestions.length > 0 || notFound) ? (
        <div className="absolute inset-x-4 top-full z-20 -mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCustomer(c)}
              className="flex min-h-14 w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 active:bg-[#FF6B35]/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#2F3E46]">
                  {c.name}
                </p>
                <p className="text-xs text-slate-500">{c.phone}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {c.loyaltyPoints.toLocaleString()}
              </span>
            </button>
          ))}
          {notFound && !searching ? (
            <p className="px-3 py-3 text-center text-xs text-slate-400">
              No customer found for this number
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
