export interface CancelledOrderAuditRow {
  id: string;
  orderNumber: string;
  status: "CANCELLED";
  subTotal: number;
  grandTotal: number;
  cancelReason: string | null;
  canceledBy: string | null;
  createdAt: string;
  updatedAt: string;
  branch: { id: string; name: string; code: string } | null;
  table: { id: string; tableNumber: string } | null;
}

export interface CancelledOrdersAudit {
  totalVoidedAmount: number;
  totalVoidedTickets: number;
  currency: string;
  orders: CancelledOrderAuditRow[];
}
