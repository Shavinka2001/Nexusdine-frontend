import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  address: z.string().min(2, "Address is required"),
  phone: z.string().min(7, "Phone number is required"),
  vat: z.number().min(0).max(100),
  sscl: z.number().min(0).max(100),
  serviceCharge: z.number().min(0).max(100),
});

export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(120),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  additionalPrice: z.number().min(0, "Must be 0 or more"),
});

const addOnSchema = z.object({
  name: z.string().min(1, "Add-on name is required"),
  price: z.number().min(0, "Must be 0 or more"),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price is required"),
  imageUrl: z
    .union([z.literal(""), z.string().url("Enter a valid URL")])
    .optional(),
  categoryId: z.string().min(1, "Select a category"),
  variants: z.array(variantSchema),
  addOns: z.array(addOnSchema),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
