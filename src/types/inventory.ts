export type IngredientUnit = "KG" | "LTR" | "PCS" | "GRAMS" | "ML";

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { ingredients: number };
}

export interface Ingredient {
  id: string;
  tenantId: string;
  supplierId: string | null;
  name: string;
  sku: string | null;
  unit: IngredientUnit;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  supplier?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export interface CreateSupplierPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateIngredientPayload {
  name: string;
  sku?: string;
  unit: IngredientUnit;
  currentStock?: number;
  minStockLevel?: number;
  costPerUnit?: number;
  supplierId?: string;
}

export interface RecipeLine {
  id?: string;
  ingredientId: string;
  quantityRequired: number;
  ingredient?: {
    id: string;
    name: string;
    unit: IngredientUnit;
    sku: string | null;
    currentStock: number;
  };
}

export interface ProductRecipe {
  productId: string;
  productName: string;
  items: RecipeLine[];
}

export interface UpsertRecipePayload {
  items: { ingredientId: string; quantityRequired: number }[];
}
