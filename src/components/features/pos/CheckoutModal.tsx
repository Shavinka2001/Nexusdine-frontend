"use client";

import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  Delete,
  Loader2,
  QrCode,
  UserRound,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import {
  completeOrder,
  createOrder,
  updateOrderItems,
  type PaymentMethod,
} from "@/lib/orders-api";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartTotals, useCartStore } from "@/store/useCartStore";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful settlement (e.g. to refresh tables/orders) */
  onSettled?: () => void;
}

const METHODS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "QR", label: "QR", icon: QrCode },
];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"] as const;

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Short synthesized chime — no audio asset needed */
function playSuccessSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // Audio is a nicety — never block checkout on it
  }
}

export function CheckoutModal({ open, onClose, onSettled }: CheckoutModalProps) {
  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.cartItems);
  const selectedTableId = useCartStore((s) => s.selectedTableId);
  const activeOrderId = useCartStore((s) => s.activeOrderId);
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const redeemLoyaltyPoints = useCartStore((s) => s.redeemLoyaltyPoints);
  const clearCart = useCartStore((s) => s.clearCart);
  const { grandTotal, loyaltyDiscount, loyaltyPointsUsed } = useCartStore(
    useShallow((s) => {
      const t = selectCartTotals(s);
      return {
        grandTotal: t.grandTotal,
        loyaltyDiscount: t.loyaltyDiscount,
        loyaltyPointsUsed: t.loyaltyPointsUsed,
      };
    }),
  );

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidDigits, setPaidDigits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Reset entry when the modal opens — not on every totals recalculation
  useEffect(() => {
    if (!open) return;
    setMethod("CASH");
    setPaidDigits("");
    setSubmitting(false);
    submittingRef.current = false;
  }, [open]);

  // Whole-rupee keypad entry for fast tablet checkout
  const paidValue = paidDigits === "" ? 0 : Number(paidDigits);
  const changeDue = round2(paidValue - grandTotal);
  const cashOk = paidValue >= grandTotal;
  const shortfall = round2(Math.max(0, grandTotal - paidValue));

  const onKey = (key: (typeof KEYS)[number]) => {
    if (key === "C") {
      setPaidDigits("");
      return;
    }
    if (key === "⌫") {
      setPaidDigits((v) => v.slice(0, -1));
      return;
    }
    if (paidDigits.length >= 9) return;
    setPaidDigits((v) => (v === "0" ? key : `${v}${key}`));
  };

  // Hardware keyboard support for POS terminals with keypads
  useEffect(() => {
    if (!open || method !== "CASH") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") onKey(e.key as (typeof KEYS)[number]);
      else if (e.key === "Backspace") onKey("⌫");
      else if (e.key === "Escape") setPaidDigits("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const resolveBranchId = async () => {
    if (user?.branchId) return user.branchId;
    try {
      const branches = await fetchBranches();
      return branches[0]?.id ?? null;
    } catch {
      return null;
    }
  };

  const submit = async () => {
    if (submittingRef.current) return;
    if (cartItems.length === 0) return;
    if (method === "CASH" && !cashOk) {
      toast("Amount paid is less than the amount due", "error");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    const branchId = await resolveBranchId();
    if (!branchId) {
      toast("Assign a branch before billing", "error");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const qtyByProduct = new Map<string, number>();
    for (const item of cartItems) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const items = [...qtyByProduct.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const pointsRedeemed =
      redeemLoyaltyPoints && loyaltyPointsUsed > 0
        ? loyaltyPointsUsed
        : undefined;

    try {
      if (activeOrderId) {
        // Settling a recalled dine-in order: sync items, then complete
        await updateOrderItems(activeOrderId, items);
        await completeOrder(activeOrderId, {
          paymentMethod: method,
          loyaltyPointsRedeemed: pointsRedeemed,
        });
      } else {
        // Takeaway / direct sale: create and settle in one go
        const order = await createOrder({
          branchId,
          tableId: selectedTableId || undefined,
          customerId: selectedCustomer?.id,
          loyaltyPointsRedeemed: pointsRedeemed,
          paymentMethod: method,
          items,
        });
        await completeOrder(order.id);
      }

      playSuccessSound();
      toast(
        selectedCustomer
          ? `Order completed — ${formatLkr(grandTotal)} · ${selectedCustomer.name}`
          : `Order completed — ${formatLkr(grandTotal)}`,
        "success",
      );
      clearCart();
      onSettled?.();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not complete order"), "error");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Checkout"
      className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto"
    >
      <div className="space-y-4">
        {/* Amount due, front and center */}
        <div className="rounded-2xl bg-[#2F3E46] px-5 py-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Amount due
          </p>
          <p className="mt-1 font-display text-4xl text-white">
            {formatLkr(grandTotal)}
          </p>
          {loyaltyDiscount > 0 ? (
            <p className="mt-1 text-xs font-semibold text-emerald-300">
              Loyalty discount applied · −{formatLkr(loyaltyDiscount)} (
              {loyaltyPointsUsed.toLocaleString()} pts)
            </p>
          ) : null}
          {selectedCustomer ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/60">
              <UserRound className="h-3 w-3" />
              {selectedCustomer.name}
            </p>
          ) : null}
        </div>

        {/* Payment method cards */}
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 text-sm font-bold transition-none active:scale-[0.98]",
                  active
                    ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-slate-200 bg-white text-[#2F3E46]",
                )}
              >
                <Icon className="h-6 w-6" />
                {m.label}
              </button>
            );
          })}
        </div>

        {method === "CASH" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {/* Left column: amounts */}
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Amount due
                </p>
                <p className="mt-0.5 text-2xl font-bold text-[#2F3E46]">
                  {formatLkr(grandTotal)}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#FF6B35]/50 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FF6B35]/70">
                  Amount paid
                </p>
                <p className="mt-0.5 text-2xl font-bold text-[#2F3E46] tabular-nums">
                  {formatLkr(paidValue)}
                </p>
              </div>

              <div
                className={cn(
                  "flex-1 rounded-2xl border px-4 py-3",
                  cashOk
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50/70",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide",
                    cashOk ? "text-emerald-700/70" : "text-rose-500/80",
                  )}
                >
                  {cashOk ? "Change due" : "Remaining"}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-3xl font-bold tabular-nums",
                    cashOk ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {cashOk ? formatLkr(changeDue) : formatLkr(shortfall)}
                </p>
              </div>
            </div>

            {/* Right column: numpad */}
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={
                    key === "⌫" ? "Backspace" : key === "C" ? "Clear" : key
                  }
                  onClick={() => onKey(key)}
                  className={cn(
                    "flex min-h-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm transition-none active:scale-[0.96]",
                    key === "C"
                      ? "bg-rose-100 text-rose-600 active:bg-rose-200"
                      : key === "⌫"
                        ? "bg-slate-200 text-[#2F3E46] active:bg-slate-300"
                        : "bg-white text-[#2F3E46] ring-1 ring-slate-200 active:bg-[#FF6B35] active:text-white",
                  )}
                >
                  {key === "⌫" ? <Delete className="h-6 w-6" /> : key}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-500">
              Confirm the {method === "CARD" ? "card" : "QR"} payment of
            </p>
            <p className="mt-1 font-display text-3xl text-[#2F3E46]">
              {formatLkr(grandTotal)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              on the terminal, then complete the order below.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={
            submitting ||
            cartItems.length === 0 ||
            (method === "CASH" && !cashOk)
          }
          onClick={() => void submit()}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] text-lg font-bold text-white shadow-sm transition-none active:scale-[0.99] disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              Complete Order
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
