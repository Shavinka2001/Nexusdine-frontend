import { api } from "@/lib/api";
import type { Branch, Category, Product } from "@/types/catalog";

export async function fetchBranches() {
  const { data } = await api.get<Branch[]>("/branches");
  return data;
}

export async function createBranch(payload: {
  name: string;
  address?: string;
  phone?: string;
  taxConfig: { vat: number; sscl: number; serviceCharge: number };
}) {
  const { data } = await api.post<Branch>("/branches", payload);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: {
  name: string;
  description?: string;
}) {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}

export async function fetchProducts(categoryId?: string) {
  const { data } = await api.get<Product[]>("/products", {
    params: categoryId ? { categoryId } : undefined,
  });
  return data;
}

export async function createProduct(payload: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive?: boolean;
  variants?: { name: string; additionalPrice: number }[];
  addOns?: { name: string; price: number }[];
}) {
  const { data } = await api.post<Product>("/products", payload);
  return data;
}
