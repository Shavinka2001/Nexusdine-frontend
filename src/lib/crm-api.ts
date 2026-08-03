import { api } from "@/lib/api";
import type {
  Customer,
  CustomerHistory,
  LoyaltyConfig,
  UpsertCustomerPayload,
  UpsertLoyaltyConfigPayload,
} from "@/types/crm";

export async function fetchCustomers(q?: string) {
  const { data } = await api.get<Customer[]>("/customers", {
    params: q ? { q } : undefined,
  });
  return data;
}

export async function upsertCustomer(payload: UpsertCustomerPayload) {
  const { data } = await api.post<Customer>("/customers", payload);
  return data;
}

export async function searchCustomerByPhone(phone: string) {
  const { data } = await api.get<Customer>("/customers/search", {
    params: { phone },
  });
  return data;
}

export async function fetchCustomerHistory(id: string) {
  const { data } = await api.get<CustomerHistory>(`/customers/${id}/history`);
  return data;
}

export async function fetchLoyaltyConfig() {
  const { data } = await api.get<LoyaltyConfig>("/loyalty/config");
  return data;
}

export async function saveLoyaltyConfig(payload: UpsertLoyaltyConfigPayload) {
  const { data } = await api.post<LoyaltyConfig>("/loyalty/config", payload);
  return data;
}
