"use client";

import { create } from "zustand";

export type CuisineType =
  | "sri-lankan"
  | "indian"
  | "chinese"
  | "italian"
  | "fast-food"
  | "cafe"
  | "mixed";

export type CurrencyCode = "LKR" | "USD";
export type TaxSelection = "NONE" | "VAT" | "SSCL";

export interface RegisterFormData {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  restaurantName: string;
  branchLocation: string;
  cuisineType: CuisineType | "";
  tableCount: number;
  currency: CurrencyCode;
  taxSelection: TaxSelection;
}

interface RegisterState {
  step: 1 | 2 | 3;
  data: RegisterFormData;
  setStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  prevStep: () => void;
  update: (patch: Partial<RegisterFormData>) => void;
  reset: () => void;
}

const initialData: RegisterFormData = {
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  restaurantName: "",
  branchLocation: "",
  cuisineType: "",
  tableCount: 10,
  currency: "LKR",
  taxSelection: "VAT",
};

export const useRegisterStore = create<RegisterState>((set, get) => ({
  step: 1,
  data: initialData,
  setStep: (step) => set({ step }),
  nextStep: () => {
    const current = get().step;
    if (current < 3) set({ step: (current + 1) as 1 | 2 | 3 });
  },
  prevStep: () => {
    const current = get().step;
    if (current > 1) set({ step: (current - 1) as 1 | 2 | 3 });
  },
  update: (patch) => set((state) => ({ data: { ...state.data, ...patch } })),
  reset: () => set({ step: 1, data: initialData }),
}));

export const CUISINE_OPTIONS = [
  { value: "sri-lankan", label: "Sri Lankan" },
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "italian", label: "Italian" },
  { value: "fast-food", label: "Fast Food" },
  { value: "cafe", label: "Café & Bakery" },
  { value: "mixed", label: "Mixed / Multi-cuisine" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "LKR", label: "LKR — Sri Lankan Rupee" },
  { value: "USD", label: "USD — US Dollar" },
] as const;

export const TAX_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "VAT", label: "VAT" },
  { value: "SSCL", label: "SSCL" },
] as const;
