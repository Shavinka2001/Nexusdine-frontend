import { resolveAppRole, type AppRole } from "@/lib/roles";
import type { UserRole } from "@/types/auth";

/** Default landing route after login for each role */
export function getHomeRouteForRole(role: UserRole | AppRole): string {
  const appRole = resolveAppRole(role);
  switch (appRole) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "OWNER":
    case "MANAGER":
      return "/dashboard";
    case "CASHIER":
      return "/dashboard/pos";
    case "WAITER":
      return "/dashboard/floor";
    case "CHEF":
      return "/dashboard/kitchen";
    default:
      return "/login";
  }
}

/** Roles allowed to visit a given path prefix — mirrors sidebar matrix */
export function getAllowedRolesForPath(pathname: string): AppRole[] | null {
  if (pathname.startsWith("/super-admin")) {
    return ["SUPER_ADMIN"];
  }
  if (pathname.startsWith("/dashboard/super-admin")) {
    return ["SUPER_ADMIN"];
  }
  if (pathname.startsWith("/dashboard/branches")) {
    return ["OWNER"];
  }
  if (pathname.startsWith("/dashboard/menu")) {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard/staff")) {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard/crm")) {
    return ["OWNER", "MANAGER", "CASHIER"];
  }
  if (pathname.startsWith("/dashboard/financials")) {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard/audit")) {
    return ["OWNER"];
  }
  if (
    pathname.startsWith("/dashboard/suppliers") ||
    pathname.startsWith("/dashboard/inventory")
  ) {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard/tables")) {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard/kitchen")) {
    return ["OWNER", "MANAGER", "CHEF"];
  }
  if (pathname.startsWith("/dashboard/floor")) {
    return ["OWNER", "MANAGER", "CASHIER", "WAITER"];
  }
  if (pathname.startsWith("/dashboard/pos")) {
    return ["OWNER", "MANAGER", "CASHIER", "WAITER"];
  }
  // Dashboard home
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return ["OWNER", "MANAGER"];
  }
  if (pathname.startsWith("/dashboard")) {
    return ["OWNER", "MANAGER", "CHEF"];
  }
  if (pathname.startsWith("/settings")) {
    return ["OWNER"];
  }
  if (pathname.startsWith("/tables")) {
    return ["WAITER", "CASHIER", "MANAGER", "OWNER"];
  }
  // /order is a public QR guest surface — no role gate
  if (pathname.startsWith("/order")) {
    return null;
  }
  return null;
}

export function canAccessPath(
  role: UserRole | AppRole,
  pathname: string,
): boolean {
  const appRole = resolveAppRole(role);
  if (!appRole) return false;
  const allowed = getAllowedRolesForPath(pathname);
  if (!allowed) return true;
  return allowed.includes(appRole);
}
