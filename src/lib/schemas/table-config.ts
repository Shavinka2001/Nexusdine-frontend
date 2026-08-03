import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required").max(32),
  capacity: z
    .number({ message: "Capacity is required" })
    .int("Must be a whole number")
    .min(1, "At least 1 seat")
    .max(100, "Max 100 seats"),
});

export type CreateTableFormValues = z.infer<typeof createTableSchema>;
