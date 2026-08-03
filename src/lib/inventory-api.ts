import { api } from "@/lib/api";
import type {
  CreateIngredientPayload,
  CreateSupplierPayload,
  Ingredient,
  ProductRecipe,
  Supplier,
  UpsertRecipePayload,
} from "@/types/inventory";

export async function fetchSuppliers() {
  const { data } = await api.get<Supplier[]>("/suppliers");
  return data;
}

export async function createSupplier(payload: CreateSupplierPayload) {
  const { data } = await api.post<Supplier>("/suppliers", payload);
  return data;
}

export async function fetchIngredients() {
  const { data } = await api.get<Ingredient[]>("/ingredients");
  return data;
}

export async function createIngredient(payload: CreateIngredientPayload) {
  const { data } = await api.post<Ingredient>("/ingredients", payload);
  return data;
}

export async function fetchProductRecipe(productId: string) {
  const { data } = await api.get<ProductRecipe>(
    `/products/${productId}/recipe`,
  );
  return data;
}

export async function saveProductRecipe(
  productId: string,
  payload: UpsertRecipePayload,
) {
  const { data } = await api.post<ProductRecipe>(
    `/products/${productId}/recipe`,
    payload,
  );
  return data;
}
