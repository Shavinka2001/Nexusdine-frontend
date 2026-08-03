import { api } from "@/lib/api";
import type { PosOrder } from "@/lib/orders-api";
import type { ConfigTable, CreateTablePayload } from "@/types/table-config";

export interface FloorTable extends ConfigTable {
  activeOrder: PosOrder | null;
}

export async function fetchTablesByBranch(branchId: string) {
  const { data } = await api.get<ConfigTable[]>(
    `/tables/branch/${branchId}`,
  );
  return data;
}

export async function fetchTableFloorStatus(branchId: string) {
  const { data } = await api.get<FloorTable[]>(
    `/tables/branch/${branchId}/status`,
  );
  return data;
}

export async function updateTableStatus(
  tableId: string,
  payload: {
    status: ConfigTable["status"];
    guestCount?: number;
  },
) {
  const { data } = await api.patch<ConfigTable>(
    `/tables/${tableId}/status`,
    payload,
  );
  return data;
}

export async function createTable(payload: CreateTablePayload) {
  const { data } = await api.post<ConfigTable>("/tables", payload);
  return data;
}

export async function deleteTable(id: string) {
  const { data } = await api.delete<{ id: string; deleted: boolean }>(
    `/tables/${id}`,
  );
  return data;
}
