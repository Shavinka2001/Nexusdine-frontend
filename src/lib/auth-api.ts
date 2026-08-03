import { api } from "@/lib/api";
import type { AuthUser, LoginResponse, RegisterResponse } from "@/types/auth";
import type { RegisterFormData } from "@/store/register-store";

export function mapApiUserToAuthUser(
  user: LoginResponse["user"],
  extras?: {
    branchName?: string;
    restaurantName?: string;
    logoUrl?: string | null;
  },
): AuthUser {
  const role = user.role === "KITCHEN" ? "CHEF" : user.role;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role,
    restaurantId: user.tenantId ?? "",
    restaurantName: extras?.restaurantName,
    logoUrl: extras?.logoUrl ?? null,
    branchId: user.branchId,
    branchName: extras?.branchName ?? "Main Floor",
  };
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function registerRequest(payload: RegisterFormData) {
  const { data } = await api.post<RegisterResponse>("/auth/register", {
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    restaurantName: payload.restaurantName,
    branchLocation: payload.branchLocation,
    cuisineType: payload.cuisineType,
    tableCount: payload.tableCount,
    currency: payload.currency,
    taxSelection: payload.taxSelection,
  });
  return data;
}

export function mapRegisterToAuthUser(data: RegisterResponse): AuthUser {
  return mapApiUserToAuthUser(data.user, {
    branchName: data.branch.name,
    restaurantName: data.tenant.name,
  });
}

export async function fetchMe() {
  const { data } = await api.get<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AuthUser["role"];
    tenantId: string | null;
    branchId: string | null;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      settings?: { logoUrl?: string } | Record<string, unknown>;
    };
    branch?: { id: string; name: string };
  }>("/auth/me");
  return data;
}
