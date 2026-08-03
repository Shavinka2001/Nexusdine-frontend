import { z } from "zod";

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  amount: z
    .number({ message: "Amount is required" })
    .min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD"], {
    message: "Select a payment method",
  }),
  description: z.string().max(500).optional(),
});

export type CreateExpenseFormValues = z.infer<typeof createExpenseSchema>;
