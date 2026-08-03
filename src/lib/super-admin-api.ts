import { api } from "@/lib/api";

export type WhatsAppMode = "SHARED" | "CUSTOM";
export type TenantStatus = "ACTIVE" | "SUSPENDED" | "TRIAL";

export interface GlobalWhatsAppSettings {
  id: string;
  globalWhatsappSid: string | null;
  globalWhatsappToken: string | null;
  globalWhatsappTokenSet: boolean;
  globalWhatsappPhone: string | null;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxBranches: number;
  maxProducts: number;
  maxUsers: number;
  isActive: boolean;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantBillingItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  isActive: boolean;
  trialEndsAt: string | null;
  billingInterval: "MONTHLY" | "YEARLY" | null;
  whatsappMode: WhatsAppMode;
  whatsappCredits: number;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number;
  } | null;
  owner: { id: string; name: string; email: string } | null;
  branchCount: number;
  userCount: number;
  productCount: number;
  billingHistory: TenantBillingItem[];
}

export interface SaaSGrowthPoint {
  month: string;
  label: string;
  activeTenants: number;
  mrr: number;
}

export interface SuperAdminStats {
  mrr: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalTenants: number;
  pendingPayments: number;
  whatsappUsage: number;
  smsUsage: number;
  messageUsageTotal: number;
  apiCreditsRemaining: number;
  platformGrowthPct: number;
  series: SaaSGrowthPoint[];
}

export interface TenantWhatsAppStatus {
  whatsappMode: WhatsAppMode;
  whatsappCredits: number;
  customConfigured: boolean;
  custom: {
    accountSid: string;
    fromNumber: string;
    authTokenSet: boolean;
  };
}

export async function fetchSuperAdminStats() {
  const { data } = await api.get<SuperAdminStats>("/super-admin/stats");
  return data;
}

export async function fetchSuperAdminTenants() {
  const { data } = await api.get<SuperAdminTenant[]>("/super-admin/tenants");
  return data;
}

export async function patchTenantStatus(
  tenantId: string,
  payload: {
    status: TenantStatus;
    extendTrialDays?: number;
    subscriptionPlanId?: string;
  },
) {
  const { data } = await api.patch<{
    id: string;
    name: string;
    status: TenantStatus;
    isActive: boolean;
    trialEndsAt: string | null;
  }>(`/super-admin/tenants/${tenantId}/status`, payload);
  return data;
}

export async function fetchSubscriptionPlans() {
  const { data } = await api.get<SubscriptionPlan[]>("/super-admin/plans");
  return data;
}

export async function createSubscriptionPlan(payload: {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxBranches: number;
  maxProducts: number;
  maxUsers: number;
  isActive?: boolean;
}) {
  const { data } = await api.post<SubscriptionPlan>(
    "/super-admin/plans",
    payload,
  );
  return data;
}

export async function fetchGlobalWhatsAppSettings() {
  const { data } = await api.get<GlobalWhatsAppSettings>(
    "/super-admin/global-settings",
  );
  return data;
}

export async function saveGlobalWhatsAppSettings(payload: {
  globalWhatsappSid?: string;
  globalWhatsappToken?: string;
  globalWhatsappPhone?: string;
}) {
  const { data } = await api.post<GlobalWhatsAppSettings>(
    "/super-admin/global-settings",
    payload,
  );
  return data;
}

export async function patchTenantWhatsAppConfig(
  tenantId: string,
  payload: {
    whatsappMode?: WhatsAppMode;
    whatsappCredits?: number;
    creditsTopUp?: number;
  },
) {
  const { data } = await api.patch<{
    id: string;
    name: string;
    whatsappMode: WhatsAppMode;
    whatsappCredits: number;
  }>(`/super-admin/tenants/${tenantId}/whatsapp-config`, payload);
  return data;
}

export async function fetchMyWhatsAppStatus() {
  const { data } = await api.get<TenantWhatsAppStatus>(
    "/restaurants/me/whatsapp",
  );
  return data;
}

export async function saveMyWhatsAppCredentials(payload: {
  accountSid: string;
  authToken?: string;
  fromNumber: string;
}) {
  const { data } = await api.post<TenantWhatsAppStatus>(
    "/restaurants/me/whatsapp-credentials",
    payload,
  );
  return data;
}
