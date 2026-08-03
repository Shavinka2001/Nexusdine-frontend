"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import {
  fetchSuperAdminStats,
  fetchSuperAdminTenants,
  patchTenantStatus,
  type SuperAdminStats,
  type SuperAdminTenant,
  type TenantStatus,
} from "@/lib/super-admin-api";
import { toast } from "@/store/useToastStore";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function statusTone(status: TenantStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "TRIAL":
      return "bg-[#FFF3EE] text-[#FF6B35]";
    case "SUSPENDED":
      return "bg-red-50 text-red-700";
  }
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SuperAdminTenant | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        fetchSuperAdminStats(),
        fetchSuperAdminTenants(),
      ]);
      setStats(s);
      setTenants(t);
    } catch (err) {
      toast(getApiErrorMessage(err, "Failed to load SaaS metrics"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyStatus(
    tenant: SuperAdminTenant,
    status: TenantStatus,
    extendTrialDays?: number,
  ) {
    setBusy(true);
    try {
      const updated = await patchTenantStatus(tenant.id, {
        status,
        extendTrialDays,
      });
      setTenants((prev) =>
        prev.map((row) =>
          row.id === tenant.id
            ? {
                ...row,
                status: updated.status,
                isActive: updated.isActive,
                trialEndsAt: updated.trialEndsAt,
              }
            : row,
        ),
      );
      setSelected((prev) =>
        prev && prev.id === tenant.id
          ? {
              ...prev,
              status: updated.status,
              isActive: updated.isActive,
              trialEndsAt: updated.trialEndsAt,
            }
          : prev,
      );
      toast(`${tenant.name} → ${status}`, "success");
      const s = await fetchSuperAdminStats();
      setStats(s);
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not update tenant"), "error");
    } finally {
      setBusy(false);
    }
  }

  const kpis = stats
    ? [
        {
          label: "MRR",
          value: formatLkr(stats.mrr),
          hint: "Monthly recurring revenue",
          icon: CreditCard,
        },
        {
          label: "Active Tenants",
          value: String(stats.activeTenants),
          hint: `${stats.trialTenants} on trial · ${stats.suspendedTenants} suspended`,
          icon: Building2,
        },
        {
          label: "Platform Growth",
          value: `${stats.platformGrowthPct >= 0 ? "+" : ""}${stats.platformGrowthPct}%`,
          hint: "Active tenants vs prior month",
          icon: TrendingUp,
        },
        {
          label: "API Credits",
          value: stats.apiCreditsRemaining.toLocaleString(),
          hint: `${stats.messageUsageTotal} msgs sent · ${stats.pendingPayments} pending payments`,
          icon: Zap,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35]">
          SaaS analytics
        </p>
        <h1 className="mt-1 font-display text-3xl text-[#2F3E46]">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform health, growth, and tenant lifecycle controls.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {kpi.label}
                    </p>
                    <Icon className="h-4 w-4 text-[#FF6B35]" />
                  </div>
                  <p className="mt-3 font-display text-2xl text-slate-900">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>
                </div>
              );
            })}
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg text-slate-900">SaaS growth</h2>
        <p className="text-sm text-slate-500">
          Monthly active tenants and MRR — last 12 months
        </p>
        <div className="mt-4 h-64 w-full md:h-80">
          {loading || !stats ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.series}>
                <defs>
                  <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tenantFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F3E46" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2F3E46" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    color: "#0f172a",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="activeTenants"
                  name="Active tenants"
                  stroke="#2F3E46"
                  fill="url(#tenantFill)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke="#FF6B35"
                  fill="url(#mrrFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-display text-lg text-slate-900">
              Tenant management
            </h2>
            <p className="text-sm text-slate-500">
              Tap a restaurant for billing details and lifecycle actions.
            </p>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-semibold">Restaurant</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Branches</th>
                <th className="px-6 py-3 font-semibold">Credits</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan={5} className="px-6 py-3">
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                : tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      onClick={() => setSelected(tenant)}
                      className="cursor-pointer border-t border-slate-100 text-slate-800 transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-900">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-slate-500">{tenant.slug}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            statusTone(tenant.status),
                          )}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {tenant.plan?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {tenant.branchCount}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {tenant.whatsappCredits}
                      </td>
                    </tr>
                  ))}
              {!loading && tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No restaurant tenants yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Tenant"}
        className="w-[min(100%,26rem)]"
      >
        {selected ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Owner
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {selected.owner?.name ?? "—"}
              </p>
              <p className="text-sm text-slate-500">
                {selected.owner?.email ?? "No owner email"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Branches</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selected.branchCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Plan</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selected.plan?.name ?? "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Billing history
              </p>
              <ul className="mt-2 space-y-2">
                {selected.billingHistory.length === 0 ? (
                  <li className="text-sm text-slate-500">No payments yet.</li>
                ) : (
                  selected.billingHistory.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-600">
                        {b.description || b.status}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {b.currency} {b.amount.toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Button
                fullWidth
                disabled={busy || selected.status === "ACTIVE"}
                onClick={() => void applyStatus(selected, "ACTIVE")}
              >
                Activate Account
              </Button>
              <Button
                fullWidth
                variant="secondary"
                disabled={busy}
                onClick={() => void applyStatus(selected, "TRIAL", 14)}
              >
                Extend Free Trial (+14 days)
              </Button>
              <Button
                fullWidth
                variant="danger"
                disabled={busy || selected.status === "SUSPENDED"}
                onClick={() => void applyStatus(selected, "SUSPENDED")}
              >
                Suspend Account
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
