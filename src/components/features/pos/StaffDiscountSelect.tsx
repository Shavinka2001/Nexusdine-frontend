"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Loader2, UserCog } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { fetchStaff, fetchStaffDiscountConfig } from "@/lib/staff-api";
import { cn } from "@/lib/cn";
import { selectCartTotals, useCartStore } from "@/store/useCartStore";
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

/**
 * Audited staff meal control — sits under CRM customer lookup in the POS cart.
 */
export function StaffDiscountSelect() {
  const applyStaffDiscount = useCartStore((s) => s.applyStaffDiscount);
  const staffRecipientId = useCartStore((s) => s.staffRecipientId);
  const staffDiscountConfig = useCartStore((s) => s.staffDiscountConfig);
  const setApplyStaffDiscount = useCartStore((s) => s.setApplyStaffDiscount);
  const setStaffRecipientId = useCartStore((s) => s.setStaffRecipientId);
  const setStaffDiscountConfig = useCartStore((s) => s.setStaffDiscountConfig);

  const { staffDiscountAmount, staffDiscountPercent } = useCartStore(
    useShallow((s) => {
      const t = selectCartTotals(s);
      return {
        staffDiscountAmount: t.staffDiscountAmount,
        staffDiscountPercent: t.staffDiscountPercent,
      };
    }),
  );

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, config] = await Promise.all([
          fetchStaff(),
          fetchStaffDiscountConfig(),
        ]);
        if (cancelled) return;
        setStaff(list);
        setStaffDiscountConfig(config);
      } catch {
        // Cashiers without access or offline — keep toggle hidden via inactive config
        if (!cancelled) {
          setStaffDiscountConfig({
            staffDiscountPercentage: 0.5,
            maxPerDay: 1,
            isActive: false,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setStaffDiscountConfig]);

  if (staffDiscountConfig && !staffDiscountConfig.isActive) {
    return null;
  }

  const pctLabel = Math.round(
    (staffDiscountConfig?.staffDiscountPercentage ?? staffDiscountPercent) *
      100,
  );

  return (
    <div className="border-t border-slate-100 px-3 py-3">
      <button
        type="button"
        onClick={() => setApplyStaffDiscount(!applyStaffDiscount)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
          applyStaffDiscount
            ? "border-[#FF6B35]/40 bg-orange-50"
            : "border-slate-200 bg-slate-50 hover:border-[#FF6B35]/30",
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              applyStaffDiscount
                ? "bg-[#FF6B35] text-white"
                : "bg-white text-[#FF6B35]",
            )}
          >
            <BadgePercent className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#2F3E46]">
              Apply Staff Discount
            </span>
            <span className="block text-[11px] text-slate-500">
              {pctLabel}% employee meal · max{" "}
              {staffDiscountConfig?.maxPerDay ?? 1}/day
            </span>
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            applyStaffDiscount ? "bg-[#FF6B35]" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              applyStaffDiscount ? "left-5" : "left-0.5",
            )}
          />
        </span>
      </button>

      {applyStaffDiscount ? (
        <div className="mt-2 space-y-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <UserCog className="h-3.5 w-3.5 text-[#FF6B35]" />
              Select Employee
            </span>
            <div className="relative">
              {loading ? (
                <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />
                </div>
              ) : (
                <select
                  value={staffRecipientId ?? ""}
                  onChange={(e) =>
                    setStaffRecipientId(e.target.value || null)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm font-semibold text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
                >
                  <option value="">Choose staff member…</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ·{" "}
                      {roleLabel(member.role)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          {staffRecipientId && staffDiscountAmount > 0 ? (
            <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-[#FF6B35]">
              Staff Discount ({pctLabel}%): −{formatLkr(staffDiscountAmount)}
            </p>
          ) : applyStaffDiscount && !staffRecipientId ? (
            <p className="text-xs text-amber-700">
              Select an employee to apply the audited discount.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
