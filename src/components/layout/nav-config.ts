import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CircleDollarSign,
  CookingPot,
  CreditCard,
  Grid3X3,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { AppRole } from "@/lib/roles";

export interface NavConfigItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  allowedRoles: AppRole[];
  /** Show in mobile bottom navigation */
  showInMobileNav?: boolean;
}

/**
 * Strict role → nav access matrix (sidebar + mobile).
 * OWNER admin view excludes Floor / POS — those stay for floor roles.
 */
export const NAV_CONFIG: NavConfigItem[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["OWNER", "MANAGER"],
    showInMobileNav: true,
  },
  {
    id: "kitchen",
    path: "/dashboard/kitchen",
    label: "Kitchen",
    icon: CookingPot,
    allowedRoles: ["OWNER", "MANAGER", "CHEF"],
    showInMobileNav: true,
  },
  {
    id: "branches",
    path: "/dashboard/branches",
    label: "Branches",
    icon: Store,
    allowedRoles: ["OWNER"],
  },
  {
    id: "menu",
    path: "/dashboard/menu",
    label: "Menu",
    icon: UtensilsCrossed,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "staff",
    path: "/dashboard/staff",
    label: "Staff",
    icon: Users,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "crm",
    path: "/dashboard/crm",
    label: "CRM",
    icon: HeartHandshake,
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    id: "financials",
    path: "/dashboard/financials",
    label: "Financials",
    icon: CircleDollarSign,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "suppliers",
    path: "/dashboard/suppliers",
    label: "Suppliers",
    icon: Truck,
    allowedRoles: ["OWNER"],
  },
  {
    id: "inventory",
    path: "/dashboard/inventory",
    label: "Inventory",
    icon: Boxes,
    allowedRoles: ["OWNER"],
  },
  {
    id: "table-setup",
    path: "/dashboard/tables",
    label: "Table setup",
    icon: Grid3X3,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "floor",
    path: "/dashboard/floor",
    label: "Floor",
    icon: Grid3X3,
    allowedRoles: ["OWNER", "MANAGER", "CASHIER", "WAITER"],
    showInMobileNav: true,
  },
  {
    id: "pos",
    path: "/dashboard/pos",
    label: "POS",
    icon: CreditCard,
    allowedRoles: ["CASHIER", "WAITER"],
    showInMobileNav: true,
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    icon: Settings,
    allowedRoles: ["OWNER"],
    showInMobileNav: true,
  },
];

/** Empty when role is missing/unknown — never leak admin links. */
export function getNavForRole(role: AppRole | null | undefined): NavConfigItem[] {
  if (!role) return [];
  return NAV_CONFIG.filter((item) => item.allowedRoles.includes(role));
}

export function getMobileNavForRole(
  role: AppRole | null | undefined,
): NavConfigItem[] {
  return getNavForRole(role).filter((item) => item.showInMobileNav);
}
