export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";

export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"
  | "KITCHEN"
  | "CHEF";

export interface DiningTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  taxType: "VAT" | "SSCL" | "NONE";
  taxRate: number;
  imagePath?: string | null;
  categoryId: string;
  categoryName?: string;
}

export interface OrderCartItem {
  localId: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export type NavItemId = "home" | "tables" | "order" | "settings";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
}
