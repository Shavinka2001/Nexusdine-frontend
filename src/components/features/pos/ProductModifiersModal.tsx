"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import {
  useCartStore,
  type CartAddOn,
  type CartVariant,
} from "@/store/useCartStore";
import type { Product } from "@/types/catalog";

interface ProductModifiersModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  /** Optional override — when set, POS cart store is not used (guest QR flow) */
  onAdd?: (
    product: { id: string; name: string; price: number },
    variant: CartVariant | null,
    addOns: CartAddOn[],
    quantity: number,
  ) => void;
}

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function ProductModifiersModal({
  product,
  isOpen,
  onClose,
  onAdd,
}: ProductModifiersModalProps) {
  const addToCart = useCartStore((s) => s.addToCart);

  const variants = useMemo(
    () => product?.variants?.filter((v) => v.isActive) ?? [],
    [product],
  );
  const addOns = useMemo(
    () => product?.addOns?.filter((a) => a.isActive) ?? [],
    [product],
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    new Set(),
  );
  const [quantity, setQuantity] = useState(1);

  // Fresh defaults every time the modal opens for a product
  useEffect(() => {
    if (!isOpen || !product) return;
    setSelectedVariantId(
      product.variants?.find((v) => v.isActive)?.id ?? null,
    );
    setSelectedAddOnIds(new Set());
    setQuantity(1);
  }, [isOpen, product]);

  if (!product) return null;

  const basePrice = Number(product.price);
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAddOns = addOns.filter((a) => selectedAddOnIds.has(a.id));

  const unitTotal =
    basePrice +
    Number(selectedVariant?.additionalPrice ?? 0) +
    selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0);
  const total = unitTotal * quantity;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const variantPayload: CartVariant | null = selectedVariant
      ? {
          id: selectedVariant.id,
          name: selectedVariant.name,
          additionalPrice: Number(selectedVariant.additionalPrice),
        }
      : null;
    const addOnPayload: CartAddOn[] = selectedAddOns.map((a) => ({
      id: a.id,
      name: a.name,
      price: Number(a.price),
    }));

    const payload = {
      id: product.id,
      name: product.name,
      price: basePrice,
    };

    if (onAdd) {
      onAdd(payload, variantPayload, addOnPayload, quantity);
    } else {
      addToCart(payload, variantPayload, addOnPayload, quantity);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={product.name}
      className="max-h-[92dvh] overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Category + base price header */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {product.category?.name ?? "Menu item"}
          </span>
          <span className="text-sm font-bold text-[#2F3E46]">
            Base {formatLkr(basePrice)}
          </span>
        </div>

        {variants.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold text-[#2F3E46]">
              Choose a variant
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {variants.map((variant) => {
                const active = variant.id === selectedVariantId;
                const extra = Number(variant.additionalPrice);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={cn(
                      "flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl border-2 px-2 text-sm transition-colors active:scale-[0.98]",
                      active
                        ? "border-[#FF6B35] bg-[#FF6B35] font-bold text-white"
                        : "border-slate-200 bg-white font-semibold text-[#2F3E46]",
                    )}
                  >
                    <span className="truncate">{variant.name}</span>
                    {extra > 0 ? (
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          active ? "text-white/80" : "text-slate-400",
                        )}
                      >
                        +{formatLkr(extra)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {addOns.length > 0 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold text-[#2F3E46]">Add-ons</h3>
            <div className="flex flex-wrap gap-2">
              {addOns.map((addOn) => {
                const active = selectedAddOnIds.has(addOn.id);
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    onClick={() => toggleAddOn(addOn.id)}
                    className={cn(
                      "flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-sm transition-colors active:scale-[0.98]",
                      active
                        ? "border-[#FF6B35] bg-[#FF6B35]/10 font-bold text-[#FF6B35]"
                        : "border-slate-200 bg-white font-semibold text-[#2F3E46]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        active
                          ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                    </span>
                    {addOn.name}
                    <span
                      className={cn(
                        "text-xs",
                        active ? "text-[#FF6B35]/70" : "text-slate-400",
                      )}
                    >
                      +{formatLkr(Number(addOn.price))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Quantity selector */}
        <section className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
          <span className="text-sm font-bold text-[#2F3E46]">Quantity</span>
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-[#2F3E46] active:bg-[#FF6B35] active:text-white"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-12 text-center text-xl font-bold text-[#2F3E46]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-[#2F3E46] active:bg-[#FF6B35] active:text-white"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Dynamic pricing CTA */}
        <button
          type="button"
          onClick={confirm}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] text-lg font-bold text-white shadow-sm transition-none active:scale-[0.99]"
        >
          <ShoppingCart className="h-5 w-5 shrink-0" />
          Add to Cart — {formatLkr(total)}
        </button>
      </div>
    </Modal>
  );
}
