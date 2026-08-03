export type StaffRoleApi = "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN" | "CHEF";

export interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRoleApi;
  branchId: string | null;
  isActive: boolean;
  createdAt?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: "MANAGER" | "CASHIER" | "WAITER" | "CHEF";
  branchId: string;
}
