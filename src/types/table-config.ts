export type TableFloorStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "BILLING";

export interface ConfigTable {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  status: TableFloorStatus;
  guestCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTablePayload {
  branchId: string;
  tableNumber: string;
  capacity: number;
}
