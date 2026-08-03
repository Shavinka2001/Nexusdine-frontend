import { api } from "@/lib/api";
import type { StaffDiscountSettings } from "@/store/useCartStore";
import type { CreateStaffPayload, StaffMember } from "@/types/staff";

export async function fetchStaff() {
  const { data } = await api.get<StaffMember[]>("/users/staff");
  return data;
}

export async function fetchStaffDiscountConfig() {
  const { data } = await api.get<StaffDiscountSettings>(
    "/users/staff-discount-config",
  );
  return data;
}

export async function createStaff(payload: CreateStaffPayload) {
  const { data } = await api.post<StaffMember>("/users/staff", payload);
  return data;
}

export async function deactivateStaff(id: string) {
  const { data } = await api.delete<{ id: string; isActive: boolean }>(
    `/users/staff/${id}`,
  );
  return data;
}
