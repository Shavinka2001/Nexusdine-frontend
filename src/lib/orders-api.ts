import { api } from "@/lib/api";

export type PaymentMethod = "CASH" | "CARD" | "QR";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export interface PosOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  product: { id: string; name: string; imageUrl?: string | null };
}

export interface PosOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  tableId: string | null;
  paymentMethod: PaymentMethod | null;
  subTotal: string | number;
  taxTotal: string | number;
  serviceCharge: string | number;
  grandTotal: string | number;
  discountAmount?: string | number;
  isStaffDiscount?: boolean;
  staffRecipientId?: string | null;
  notes: string | null;
  cancelReason?: string | null;
  canceledBy?: string | null;
  createdAt: string;
  items: PosOrderItem[];
  table: { id: string; tableNumber: string } | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    loyaltyPoints: number;
  } | null;
}

export interface CreateOrderPayload {
  branchId: string;
  tableId?: string;
  customerId?: string;
  loyaltyPointsRedeemed?: number;
  isStaffDiscount?: boolean;
  staffRecipientId?: string;
  /** Omitted for dine-in KOT holds — payment method is chosen at settle */
  paymentMethod?: PaymentMethod;
  items: { productId: string; quantity: number }[];
  notes?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<PosOrder>("/orders", payload);
  return data;
}

export async function fetchOrders(branchId: string, status?: OrderStatus) {
  const { data } = await api.get<PosOrder[]>("/orders", {
    params: { branchId, ...(status ? { status } : {}) },
  });
  return data;
}

export async function fetchActiveOrderByTable(tableId: string) {
  const { data } = await api.get<PosOrder>(
    `/orders/active/table/${tableId}`,
  );
  return data;
}

export async function updateOrderItems(
  orderId: string,
  items: { productId: string; quantity: number }[],
) {
  const { data } = await api.put<PosOrder>(`/orders/${orderId}/items`, {
    items,
  });
  return data;
}

export async function completeOrder(
  orderId: string,
  payload?: {
    paymentMethod?: PaymentMethod;
    loyaltyPointsRedeemed?: number;
    isStaffDiscount?: boolean;
    staffRecipientId?: string;
  },
) {
  const { data } = await api.patch<PosOrder>(
    `/orders/${orderId}/complete`,
    payload ?? {},
  );
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
) {
  const { data } = await api.patch<PosOrder>(`/orders/${orderId}/status`, {
    status,
  });
  return data;
}

export async function cancelOrder(orderId: string, reason: string) {
  const { data } = await api.patch<PosOrder>(`/orders/${orderId}/cancel`, {
    reason,
  });
  return data;
}
