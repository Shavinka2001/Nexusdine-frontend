import axios from "axios";
import type { Category, Product } from "@/types/catalog";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

/** Unauthenticated client for QR guest ordering — never attaches staff JWT */
export const publicApi = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
}

export interface PublicMenuResponse {
  tenant: PublicTenant;
  categories: Category[];
  products: Product[];
}

export interface PublicTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  branchId: string;
  branch?: { id: string; name: string; tenantId: string };
}

export interface PublicOrderStatus {
  id: string;
  orderNumber: string;
  status: string;
  tableId: string | null;
  branchId: string;
  tenantId: string;
  grandTotal: string | number;
  subTotal: string | number;
  createdAt: string;
  updatedAt: string;
  message: string;
  table: { id: string; tableNumber: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: string | number;
    totalPrice: string | number;
    product: { id: string; name: string; imageUrl: string | null };
  }[];
}

export async function fetchPublicMenu(tenantId: string) {
  const { data } = await publicApi.get<PublicMenuResponse>(
    `/public/menu/${tenantId}`,
  );
  return data;
}

export async function lookupPublicTable(
  tenantId: string,
  branchId: string,
  tableNumber: string,
) {
  const { data } = await publicApi.get<PublicTable>(
    `/public/tables/${tenantId}/lookup`,
    { params: { branchId, tableNumber } },
  );
  return data;
}

export async function fetchPublicTableById(
  tenantId: string,
  tableId: string,
  branchId?: string,
) {
  const { data } = await publicApi.get<PublicTable>(
    `/public/tables/${tenantId}/id/${tableId}`,
    { params: branchId ? { branchId } : undefined },
  );
  return data;
}

export async function createPublicOrder(payload: {
  tenantId: string;
  branchId: string;
  tableId: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}) {
  const { data } = await publicApi.post<{
    id: string;
    orderNumber: string;
    status: string;
  }>("/public/orders", payload);
  return data;
}

export async function fetchPublicOrderStatus(orderId: string) {
  const { data } = await publicApi.get<PublicOrderStatus>(
    `/public/orders/${orderId}/status`,
  );
  return data;
}

export async function submitPublicFeedback(payload: {
  orderId?: string;
  tenantId?: string;
  branchId?: string;
  rating: number;
  comment?: string;
}) {
  const { data } = await publicApi.post<{
    id: string;
    rating: number;
    recoveryTriggered: boolean;
    message: string;
  }>("/public/feedback", payload);
  return data;
}

export function getSocketUrl() {
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
  if (api) return api.replace(/\/api$/, "") || "http://localhost:3001";
  return process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
}
