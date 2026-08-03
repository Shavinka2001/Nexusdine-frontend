export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"
  | "KITCHEN"
  | "CHEF";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId: string;
  /** Display name of the tenant / restaurant */
  restaurantName?: string;
  /** Optional custom logo from tenant settings */
  logoUrl?: string | null;
  branchId: string | null;
  branchName?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string | null;
    branchId: string | null;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
}

export interface RegisterResponse {
  accessToken: string;
  tokenType: string;
  user: LoginResponse["user"];
  tenant: { id: string; name: string; slug: string };
  branch: { id: string; name: string; code: string };
}
