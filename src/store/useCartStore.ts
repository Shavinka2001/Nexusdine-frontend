"use client";

import { create } from "zustand";
import type { PosOrder } from "@/lib/orders-api";
import type { Customer } from "@/types/crm";

export type ServiceType = "TAKEAWAY" | "DINE_IN";

export interface CartVariant {
  id: string;
  name: string;
  additionalPrice: number;
}

export interface CartAddOn {
  id: string;
  name: string;
  price: number;
}

export interface CartProductInput {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  /** Composite key: [productId]-[variantId]-[sortedAddOnIdsJoined] */
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant: CartVariant | null;
  addOns: CartAddOn[];
}

export interface TaxConfig {
  vat: number;
  sscl: number;
  serviceCharge: number;
}

export interface LoyaltySettings {
  pointsPerLkr: number;
  valuePerPoint: number;
  isActive: boolean;
}

export interface StaffDiscountSettings {
  /** Fraction e.g. 0.5 = 50% */
  staffDiscountPercentage: number;
  maxPerDay: number;
  isActive: boolean;
}

export interface CartTotals {
  subtotal: number;
  vatAmount: number;
  ssclAmount: number;
  serviceChargeAmount: number;
  taxTotal: number;
  /** Grand total before any discounts */
  baseGrandTotal: number;
  /** Points actually redeemable on this bill (capped by balance and bill value) */
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  staffDiscountPercent: number;
  staffDiscountAmount: number;
  grandTotal: number;
}

function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function buildCartItemId(
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
  const addOnSum = addOns.reduce((s, a) => s + a.price, 0);
  return roundMoney(productPrice + (variant?.additionalPrice ?? 0) + addOnSum);
}

function computeTotals(
  items: CartItem[],
  tax: TaxConfig,
  customer: Customer | null,
  redeemLoyaltyPoints: boolean,
  loyalty: LoyaltySettings | null,
  applyStaffDiscount: boolean,
  staffDiscountConfig: StaffDiscountSettings | null,
): CartTotals {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const vatAmount = roundMoney(subtotal * (tax.vat / 100));
  const ssclAmount = roundMoney(subtotal * (tax.sscl / 100));
  const serviceChargeAmount = roundMoney(
    subtotal * (tax.serviceCharge / 100),
  );
  const taxTotal = roundMoney(vatAmount + ssclAmount);
  const baseGrandTotal = roundMoney(subtotal + taxTotal + serviceChargeAmount);

  let staffDiscountPercent = 0;
  let staffDiscountAmount = 0;
  if (
    applyStaffDiscount &&
    staffDiscountConfig?.isActive &&
    staffDiscountConfig.staffDiscountPercentage > 0 &&
    baseGrandTotal > 0
  ) {
    staffDiscountPercent = staffDiscountConfig.staffDiscountPercentage;
    staffDiscountAmount = roundMoney(
      baseGrandTotal * staffDiscountConfig.staffDiscountPercentage,
    );
  }

  const afterStaff = roundMoney(
    Math.max(0, baseGrandTotal - staffDiscountAmount),
  );

  let loyaltyPointsUsed = 0;
  let loyaltyDiscount = 0;

  if (
    redeemLoyaltyPoints &&
    customer &&
    customer.loyaltyPoints > 0 &&
    loyalty?.isActive &&
    loyalty.valuePerPoint > 0 &&
    afterStaff > 0
  ) {
    // Never let the discount exceed the remaining bill value
    const maxUsableByBill = Math.floor(afterStaff / loyalty.valuePerPoint);
    loyaltyPointsUsed = Math.min(customer.loyaltyPoints, maxUsableByBill);
    loyaltyDiscount = roundMoney(loyaltyPointsUsed * loyalty.valuePerPoint);
  }

  const grandTotal = roundMoney(Math.max(0, afterStaff - loyaltyDiscount));

  return {
    subtotal,
    vatAmount,
    ssclAmount,
    serviceChargeAmount,
    taxTotal,
    baseGrandTotal,
    loyaltyPointsUsed,
    loyaltyDiscount,
    staffDiscountPercent,
    staffDiscountAmount,
    grandTotal,
  };
}

interface CartState {
  cartItems: CartItem[];
  serviceType: ServiceType;
  selectedTableId: string | null;
  /** Set when an existing open order was recalled into the cart */
  activeOrderId: string | null;
  selectedCustomer: Customer | null;
  redeemLoyaltyPoints: boolean;
  applyStaffDiscount: boolean;
  staffRecipientId: string | null;
  taxConfig: TaxConfig;
  loyaltyConfig: LoyaltySettings | null;
  staffDiscountConfig: StaffDiscountSettings | null;
  addToCart: (
    product: CartProductInput,
    selectedVariant?: CartVariant | null,
    selectedAddOns?: CartAddOn[],
    quantity?: number,
  ) => void;
  removeFromCart: (productIdOrCartItemId: string) => void;
  updateQuantity: (productIdOrCartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setServiceType: (serviceType: ServiceType) => void;
  setSelectedTableId: (tableId: string | null) => void;
  setTable: (tableId: string | null) => void;
  loadOpenOrder: (order: PosOrder) => void;
  setCustomer: (customer: Customer | null) => void;
  toggleLoyaltyRedemption: () => void;
  setApplyStaffDiscount: (enabled: boolean) => void;
  setStaffRecipientId: (id: string | null) => void;
  setTaxConfig: (vat: number, sscl: number, serviceCharge: number) => void;
  setLoyaltyConfig: (config: LoyaltySettings | null) => void;
  setStaffDiscountConfig: (config: StaffDiscountSettings | null) => void;
  getTotals: () => CartTotals;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  serviceType: "TAKEAWAY",
  selectedTableId: null,
  activeOrderId: null,
  selectedCustomer: null,
  redeemLoyaltyPoints: false,
  applyStaffDiscount: false,
  staffRecipientId: null,
  taxConfig: { vat: 18, sscl: 0, serviceCharge: 0 },
  loyaltyConfig: null,
  staffDiscountConfig: null,

  addToCart: (product, selectedVariant = null, selectedAddOns = [], quantity = 1) => {
    if (quantity < 1) return;

    const cartItemId = buildCartItemId(
      product.id,
      selectedVariant,
      selectedAddOns,
    );
    const price = unitPrice(product.price, selectedVariant, selectedAddOns);

    set((state) => {
      const existing = state.cartItems.find(
        (i) => i.cartItemId === cartItemId,
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.cartItemId === cartItemId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        };
      }

      return {
        cartItems: [
          ...state.cartItems,
          {
            cartItemId,
            productId: product.id,
            name: product.name,
            price,
            quantity,
            variant: selectedVariant,
            addOns: selectedAddOns,
          },
        ],
      };
    });
  },

  removeFromCart: (productIdOrCartItemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(
        (i) =>
          i.cartItemId !== productIdOrCartItemId &&
          i.productId !== productIdOrCartItemId,
      ),
    }));
  },

  updateQuantity: (productIdOrCartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productIdOrCartItemId);
      return;
    }

    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.cartItemId === productIdOrCartItemId ||
        i.productId === productIdOrCartItemId
          ? { ...i, quantity }
          : i,
      ),
    }));
  },

  clearCart: () =>
    set({
      cartItems: [],
      selectedTableId: null,
      activeOrderId: null,
      selectedCustomer: null,
      redeemLoyaltyPoints: false,
      applyStaffDiscount: false,
      staffRecipientId: null,
    }),

  setServiceType: (serviceType) =>
    set((state) => ({
      serviceType,
      // Takeaway bills are never bound to a table or a recalled order
      ...(serviceType === "TAKEAWAY"
        ? { selectedTableId: null, activeOrderId: null }
        : {}),
      ...(serviceType === "TAKEAWAY" && state.activeOrderId
        ? {
            cartItems: [],
            selectedCustomer: null,
            redeemLoyaltyPoints: false,
            applyStaffDiscount: false,
            staffRecipientId: null,
          }
        : {}),
    })),

  setSelectedTableId: (tableId) => set({ selectedTableId: tableId }),

  setTable: (tableId) =>
    set({ selectedTableId: tableId, activeOrderId: null }),

  loadOpenOrder: (order) =>
    set({
      activeOrderId: order.id,
      selectedTableId: order.tableId,
      serviceType: order.tableId ? "DINE_IN" : "TAKEAWAY",
      redeemLoyaltyPoints: false,
      applyStaffDiscount: Boolean(order.isStaffDiscount),
      staffRecipientId: order.staffRecipientId ?? null,
      selectedCustomer: order.customer
        ? {
            id: order.customer.id,
            tenantId: "",
            name: order.customer.name,
            phone: order.customer.phone,
            email: null,
            loyaltyPoints: order.customer.loyaltyPoints,
            createdAt: "",
            updatedAt: "",
          }
        : null,
      cartItems: order.items.map((item) => ({
        // Same composite id an in-grid tap would produce, so quantities merge
        cartItemId: buildCartItemId(item.productId),
        productId: item.productId,
        name: item.product.name,
        price: roundMoney(Number(item.unitPrice)),
        quantity: item.quantity,
        variant: null,
        addOns: [],
      })),
    }),

  setCustomer: (customer) =>
    set({
      selectedCustomer: customer,
      // A new (or removed) customer invalidates any pending redemption choice
      redeemLoyaltyPoints: false,
    }),

  toggleLoyaltyRedemption: () =>
    set((state) => ({ redeemLoyaltyPoints: !state.redeemLoyaltyPoints })),

  setApplyStaffDiscount: (enabled) =>
    set({
      applyStaffDiscount: enabled,
      ...(enabled ? {} : { staffRecipientId: null }),
    }),

  setStaffRecipientId: (id) =>
    set({
      staffRecipientId: id,
      applyStaffDiscount: Boolean(id),
    }),

  setTaxConfig: (vat, sscl, serviceCharge) =>
    set({
      taxConfig: {
        vat: Number(vat) || 0,
        sscl: Number(sscl) || 0,
        serviceCharge: Number(serviceCharge) || 0,
      },
    }),

  setLoyaltyConfig: (config) => set({ loyaltyConfig: config }),

  setStaffDiscountConfig: (config) => set({ staffDiscountConfig: config }),

  getTotals: () => {
    const s = get();
    return computeTotals(
      s.cartItems,
      s.taxConfig,
      s.selectedCustomer,
      s.redeemLoyaltyPoints,
      s.loyaltyConfig,
      s.applyStaffDiscount && Boolean(s.staffRecipientId),
      s.staffDiscountConfig,
    );
  },
}));

/** Reactive selector helper for components */
export function selectCartTotals(state: CartState): CartTotals {
  return computeTotals(
    state.cartItems,
    state.taxConfig,
    state.selectedCustomer,
    state.redeemLoyaltyPoints,
    state.loyaltyConfig,
    state.applyStaffDiscount && Boolean(state.staffRecipientId),
    state.staffDiscountConfig,
  );
}
