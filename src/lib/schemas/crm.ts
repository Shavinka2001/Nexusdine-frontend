import { z } from "zod";

export const upsertCustomerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(/^(?:\+94|0)?7\d{8}$/, "Enter a valid Sri Lankan mobile number"),
  email: z
    .union([z.literal(""), z.string().email("Enter a valid email")])
    .optional(),
});

export type UpsertCustomerFormValues = z.infer<typeof upsertCustomerSchema>;

/** Owner-facing form uses spend-per-point UX; we convert to pointsPerLkr on submit. */
export const loyaltyConfigSchema = z.object({
  spendPerPoint: z
    .number({ message: "Spend amount is required" })
    .min(1, "Must be at least LKR 1")
    .max(1_000_000),
  valuePerPoint: z
    .number({ message: "Point value is required" })
    .min(0, "Cannot be negative")
    .max(10_000),
  isActive: z.boolean(),
});

export type LoyaltyConfigFormValues = z.infer<typeof loyaltyConfigSchema>;
