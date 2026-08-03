import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["MANAGER", "CASHIER", "WAITER", "CHEF"], {
    message: "Select a role",
  }),
  branchId: z.string().min(1, "Select a branch"),
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;
