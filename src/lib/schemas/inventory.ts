import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().max(120).optional(),
  phone: z.string().max(32).optional(),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  address: z.string().max(255).optional(),
});

export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>;

export const createIngredientSchema = z.object({
  name: z.string().min(2, "Ingredient name is required"),
  sku: z
    .union([
      z.literal(""),
      z.string().regex(/^[A-Z0-9_-]{2,32}$/i, "SKU must be 2–32 characters"),
    ])
    .optional(),
  unit: z.enum(["KG", "LTR", "PCS", "GRAMS", "ML"], {
    message: "Select a unit",
  }),
  currentStock: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  supplierId: z.string().optional(),
});

export type CreateIngredientFormValues = z.infer<typeof createIngredientSchema>;

const recipeLineSchema = z.object({
  ingredientId: z.string().min(1, "Select ingredient"),
  quantityRequired: z
    .number({ message: "Quantity required" })
    .min(0.0001, "Must be greater than 0"),
});

export const recipeSchema = z.object({
  productId: z.string().min(1, "Select a menu product"),
  items: z.array(recipeLineSchema).min(1, "Add at least one ingredient"),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;
