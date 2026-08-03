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
  if (role == null || role === "") return null;
  // Backend enums are UPPERCASE; tolerate TitleCase / mixed case from storage/API.
  const normalized = String(role).trim().toUpperCase();
  if (normalized === "KITCHEN" || normalized === "CHEF") return "CHEF";
  if (normalized === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (normalized === "OWNER") return "OWNER";
  if (normalized === "MANAGER") return "MANAGER";
  if (normalized === "CASHIER") return "CASHIER";
  if (normalized === "WAITER") return "WAITER";
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
