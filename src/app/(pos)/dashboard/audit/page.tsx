"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ShieldAlert,
  TicketX,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchCancelledOrdersAudit } from "@/lib/audit-api";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";
import type { CancelledOrderAuditRow, CancelledOrdersAudit } from "@/types/audit";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [audit, setAudit] = useState<CancelledOrdersAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [actorQuery, setActorQuery] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      setAudit(await fetchCancelledOrdersAudit());
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load audit logs"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const order of audit?.orders ?? []) {
      if (order.branch) {
        map.set(order.branch.id, order.branch.name);
      }
    }
    return [
      { value: "ALL", label: "All branches" },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [audit?.orders]);

  const filteredOrders = useMemo(() => {
    const q = actorQuery.trim().toLowerCase();
    return (audit?.orders ?? []).filter((order) => {
      if (branchFilter !== "ALL" && order.branch?.id !== branchFilter) {
        return false;
      }
      if (!q) return true;
      return (order.canceledBy ?? "").toLowerCase().includes(q);
    });
  }, [actorQuery, audit?.orders, branchFilter]);

  return (
    <AppShell title="Audit Logs">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Order cancellations audit
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Owner-only void trail — review who cancelled tickets, why, and how
            much revenue was written off.
          </p>
        </div>
        <Button
          variant="ghost"
          disabled={loading || refreshing}
          onClick={() => void load(true)}
          className="border border-slate-200 bg-white"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {loading || !audit ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              title="Revenue Lost (Voids)"
              value={formatLkr(audit.totalVoidedAmount)}
              subtitle="Sum of cancelled ticket grand totals"
              tone="void"
              icon={<Ban className="h-5 w-5" />}
            />
            <MetricCard
              title="Total Cancelled Tickets"
              value={String(audit.totalVoidedTickets)}
              subtitle="All cancelled orders in this restaurant"
              tone="count"
              icon={<TicketX className="h-5 w-5" />}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <h3 className="font-display text-lg text-[#2F3E46]">
                  Cancellation log
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {filteredOrders.length}
                </span>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:max-w-xl">
                <div className="min-w-[10rem] flex-1">
                  <Select
                    aria-label="Filter by branch"
                    options={branchOptions}
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                  />
                </div>
                <label className="relative block min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={actorQuery}
                    onChange={(e) => setActorQuery(e.target.value)}
                    placeholder="Search cancelled by…"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
                  />
                </label>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <FileSpreadsheet className="h-10 w-10 text-slate-300" />
                <p className="mt-3 font-display text-lg text-[#2F3E46]">
                  {audit.orders.length === 0
                    ? "No cancelled orders yet"
                    : "No matches for this filter"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {audit.orders.length === 0
                    ? "When managers void tickets, every reason and actor appears here."
                    : "Try another branch or clear the cancelled-by search."}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile card layout */}
                <div className="space-y-3 p-4 md:hidden">
                  {filteredOrders.map((order) => (
                    <AuditMobileCard key={order.id} order={order} />
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Date / Time</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3 text-right">Original Amount</th>
                        <th className="px-4 py-3">Cancelled By</th>
                        <th className="px-5 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="align-top text-[#2F3E46] hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {formatDateTime(order.updatedAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {order.branch?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {order.orderNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">
                            {formatLkr(order.grandTotal)}
                          </td>
                          <td className="max-w-[14rem] px-4 py-3 text-slate-700">
                            <span className="line-clamp-2">
                              {order.canceledBy || "Unknown"}
                            </span>
                          </td>
                          <td className="max-w-sm px-5 py-3 text-slate-600">
                            <span className="line-clamp-3">
                              {order.cancelReason || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

function AuditMobileCard({ order }: { order: CancelledOrderAuditRow }) {
  return (
    <article className="rounded-xl border border-red-100 bg-red-50/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-slate-700">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(order.updatedAt)}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-red-600">
          {formatLkr(order.grandTotal)}
        </p>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Branch</dt>
          <dd className="text-right font-semibold text-[#2F3E46]">
            {order.branch?.name ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Cancelled by</dt>
          <dd className="max-w-[60%] text-right font-medium text-[#2F3E46]">
            {order.canceledBy || "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Reason</dt>
          <dd className="mt-1 rounded-lg bg-white/80 px-3 py-2 text-[#2F3E46]">
            {order.cancelReason || "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "void" | "count";
  icon: ReactNode;
}) {
  const styles =
    tone === "void"
      ? "border-red-200 bg-red-50/50 text-red-600"
      : "border-slate-200 bg-slate-50 text-[#2F3E46]";

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", styles)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">
          {title}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            tone === "void" ? "bg-red-100 text-red-600" : "bg-white text-slate-600",
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-display text-3xl tracking-tight",
          tone === "void" ? "text-red-600" : "text-[#2F3E46]",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs opacity-70">{subtitle}</p>
    </div>
  );
}
