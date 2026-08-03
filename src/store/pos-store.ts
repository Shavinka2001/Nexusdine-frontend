"use client";

import { create } from "zustand";
import type { DiningTable, OrderCartItem, Product } from "@/types";

interface PosState {
  selectedTableId: string | null;
  cart: OrderCartItem[];
  selectTable: (tableId: string | null) => void;
  addToCart: (product: Product) => void;
  updateQuantity: (localId: string, quantity: number) => void;
  removeFromCart: (localId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  selectedTableId: null,
  cart: [],

  selectTable: (tableId) => set({ selectedTableId: tableId }),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            localId: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
          },
        ],
      };
    }),

  updateQuantity: (localId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((item) => item.localId !== localId)
          : state.cart.map((item) =>
              item.localId === localId ? { ...item, quantity } : item,
            ),
    })),

  removeFromCart: (localId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.localId !== localId),
    })),

  clearCart: () => set({ cart: [], selectedTableId: null }),

  cartTotal: () =>
    get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
}));

/** Demo tables for shell / feature scaffolding */
export const DEMO_TABLES: DiningTable[] = [
  { id: "t1", tableNumber: "1", capacity: 2, status: "AVAILABLE" },
  { id: "t2", tableNumber: "2", capacity: 4, status: "OCCUPIED" },
  { id: "t3", tableNumber: "3", capacity: 4, status: "RESERVED" },
  { id: "t4", tableNumber: "4", capacity: 6, status: "AVAILABLE" },
  { id: "t5", tableNumber: "5", capacity: 2, status: "AVAILABLE" },
  { id: "t6", tableNumber: "6", capacity: 8, status: "OCCUPIED" },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Chicken Kottu",
    price: 950,
    taxType: "VAT",
    taxRate: 18,
    categoryId: "c1",
    categoryName: "Mains",
  },
  {
    id: "p2",
    name: "Fish Ambul Thiyal",
    price: 1850,
    taxType: "VAT",
    taxRate: 18,
    categoryId: "c1",
    categoryName: "Mains",
  },
  {
    id: "p3",
    name: "Iced Milo",
    price: 350,
    taxType: "VAT",
    taxRate: 18,
    categoryId: "c2",
    categoryName: "Drinks",
  },
  {
    id: "p4",
    name: "Watalappan",
    price: 480,
    taxType: "VAT",
    taxRate: 18,
    categoryId: "c3",
    categoryName: "Dessert",
  },
];
