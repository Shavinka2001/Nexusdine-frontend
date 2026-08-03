export type LoyaltyTxnType = "EARNED" | "REDEEMED";

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  orderId: string | null;
  points: number;
  type: LoyaltyTxnType;
  note: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    grandTotal: string | number;
    status: string;
  } | null;
}

export interface CustomerHistory extends Customer {
  transactions: LoyaltyTransaction[];
}

export interface LoyaltyConfig {
  id: string | null;
  tenantId: string;
  pointsPerLkr: number;
  valuePerPoint: number;
  isActive: boolean;
  spendPerPoint: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpsertCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}

export interface UpsertLoyaltyConfigPayload {
  pointsPerLkr: number;
  valuePerPoint: number;
  isActive: boolean;
}
