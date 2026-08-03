"use client";

import { create } from "zustand";
import type { CartAddOn, CartVariant } from "@/store/useCartStore";

export interface GuestCartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant: CartVariant | null;
  addOns: CartAddOn[];
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (
    product: { id: string; name: string; price: number },
    variant?: CartVariant | null,
    addOns?: CartAddOn[],
    quantity?: number,
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  /** Replace the entire cart (remote multiplayer sync). */
  replaceItems: (items: GuestCartItem[]) => void;
  clear: () => void;
  subtotal: () => number;
}

function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function buildId(
  productId: string,
  variant?: CartVariant | null,
  addOns: CartAddOn[] = [],
) {
  const addOnKey = [...addOns]
    .map((a) => a.id)
    .sort()
    .join(",");
  return `${productId}-${variant?.id ?? "base"}-${addOnKey || "none"}`;
}

function unitPrice(
  productPrice: number,
  variant?: CartVariant | null,
  addOns: CartAddOn[] = [],
) {
  return roundMoney(
    productPrice +
      (variant?.additionalPrice ?? 0) +
      addOns.reduce((s, a) => s + a.price, 0),
  );
}

export const useGuestCartStore = create<GuestCartState>((set, get) => ({
  items: [],

  addItem: (product, variant = null, addOns = [], quantity = 1) => {
    if (quantity < 1) return;
    const cartItemId = buildId(product.id, variant, addOns);
    const price = unitPrice(product.price, variant, addOns);

    set((state) => {
      const existing = state.items.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartItemId === cartItemId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            cartItemId,
            productId: product.id,
            name: product.name,
            price,
            quantity,
            variant,
            addOns,
          },
        ],
      };
    });
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i,
      ),
    }));
  },

  removeItem: (cartItemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.cartItemId !== cartItemId),
    })),

  replaceItems: (items) => set({ items: Array.isArray(items) ? items : [] }),

  clear: () => set({ items: [] }),

  subtotal: () =>
    roundMoney(
      get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    ),
}));
