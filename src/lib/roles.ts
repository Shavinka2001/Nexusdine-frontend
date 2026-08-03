import type { UserRole } from "@/types/auth";

/** UI-facing roles (CHEF maps from backend KITCHEN) */
export type AppRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"
  | "CHEF";

/** Strict parse — returns null when role is missing/unknown (security-first). */
export function resolveAppRole(
  role: UserRole | string | undefined | null,
): AppRole | null {
  if (role === "KITCHEN" || role === "CHEF") return "CHEF";
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "OWNER") return "OWNER";
  if (role === "MANAGER") return "MANAGER";
  if (role === "CASHIER") return "CASHIER";
  if (role === "WAITER") return "WAITER";
  return null;
}

export function normalizeRole(role: UserRole | string | undefined | null): AppRole {
  return resolveAppRole(role) ?? "WAITER";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "OWNER":
      return "Owner";
    case "MANAGER":
      return "Manager";
    case "CASHIER":
      return "Cashier";
    case "WAITER":
      return "Waiter";
    case "CHEF":
      return "Chef / Kitchen";
  }
}

export function stationLabel(role: AppRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Platform control";
    case "OWNER":
    case "MANAGER":
      return "Management";
    case "CASHIER":
      return "Cashier station";
    case "WAITER":
      return "Floor service";
    case "CHEF":
      return "Kitchen display";
  }
}
