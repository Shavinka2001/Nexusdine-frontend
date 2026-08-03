"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import { cn } from "@/lib/cn";
import {
  fetchOrders,
  updateOrderStatus,
  type OrderStatus,
  type PosOrder,
} from "@/lib/orders-api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

type BoardColumn = "PENDING" | "COOKING" | "READY";

const COLUMNS: {
  key: BoardColumn;
  label: string;
  statuses: OrderStatus[];
}[] = [
  {
    key: "PENDING",
    label: "Pending",
    statuses: ["PENDING", "CONFIRMED"],
  },
  {
    key: "COOKING",
    label: "Cooking",
    statuses: ["PREPARING"],
  },
  {
    key: "READY",
    label: "Ready",
    statuses: ["READY"],
  },
];

function formatAge(createdAt: string, now: number) {
  const mins = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 60_000),
  );
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

function ageMinutes(createdAt: string, now: number) {
  return Math.floor((now - new Date(createdAt).getTime()) / 60_000);
}

function columnForStatus(status: OrderStatus): BoardColumn | null {
  if (status === "PENDING" || status === "CONFIRMED") return "PENDING";
  if (status === "PREPARING") return "COOKING";
  if (status === "READY") return "READY";
  return null;
}

export default function KitchenPage() {
  const user = useAuthStore((s) => s.user);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<BoardColumn>("PENDING");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (user?.branchId) {
          if (!cancelled) setBranchId(user.branchId);
          return;
        }
        const branches = await fetchBranches();
        if (!cancelled) setBranchId(branches[0]?.id ?? null);
      } catch (err) {
        toast(getApiErrorMessage(err, "Could not load branch"), "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.branchId]);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [pending, confirmed, preparing, ready] = await Promise.all([
        fetchOrders(branchId, "PENDING"),
        fetchOrders(branchId, "CONFIRMED"),
        fetchOrders(branchId, "PREPARING"),
        fetchOrders(branchId, "READY"),
      ]);
      const merged = [...pending, ...confirmed, ...preparing, ...ready].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setOrders(merged);
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not load kitchen orders"), "error");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
    if (!branchId) return;
    const id = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(id);
  }, [branchId, load]);

  const byColumn = useMemo(() => {
    const map: Record<BoardColumn, PosOrder[]> = {
      PENDING: [],
      COOKING: [],
      READY: [],
    };
    for (const order of orders) {
      const col = columnForStatus(order.status);
      if (col) map[col].push(order);
    }
    return map;
  }, [orders]);

  const prepItems = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of [...byColumn.PENDING, ...byColumn.COOKING]) {
      for (const item of order.items) {
        const name = item.product.name;
        totals.set(name, (totals.get(name) ?? 0) + item.quantity);
      }
    }
    return [...totals.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
  }, [byColumn.PENDING, byColumn.COOKING]);

  async function bump(order: PosOrder, next: OrderStatus, successMsg: string) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, next);
      toast(successMsg, "success");
      await load();
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not update order status"), "error");
    } finally {
      setBusyId(null);
    }
  }

  function renderCard(order: PosOrder, column: BoardColumn) {
    const overdue = ageMinutes(order.createdAt, now) >= 10;
    const busy = busyId === order.id;

    return (
      <article
        key={order.id}
        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">
                {order.orderNumber}
              </p>
              <p className="text-sm text-slate-500">
                {order.table
                  ? `Table ${order.table.tableNumber}`
                  : "Takeaway / Counter"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                overdue
                  ? "animate-pulse border-red-200 bg-red-50 text-red-600"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              <Clock3 className="h-3 w-3" />
              {formatAge(order.createdAt, now)}
            </span>
          </div>

          <ul className="space-y-2 border-t border-slate-100 pt-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {item.product.name}
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>

          {order.notes?.trim() ? (
            <p className="mt-3 text-sm font-bold text-[#FF6B35]">
              {order.notes.trim()}
            </p>
          ) : null}
        </div>

        <div className="border-t border-slate-100 p-3">
          {column === "PENDING" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void bump(order, "PREPARING", "Cooking started")
              }
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F3E46] text-sm font-semibold text-white transition hover:bg-[#3d4f58] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Start Cooking"
              )}
            </button>
          ) : null}
          {column === "COOKING" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void bump(
                  order,
                  "READY",
                  "Order marked ready — waiter paged",
                )
              }
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FF6B35] text-sm font-semibold text-white transition hover:bg-[#e05621] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Mark Ready"
              )}
            </button>
          ) : null}
          {column === "READY" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void bump(order, "SERVED", "Order dismissed from KDS")
              }
              className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Dismiss / Archive"
              )}
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  function renderColumn(column: BoardColumn, className?: string) {
    const meta = COLUMNS.find((c) => c.key === column)!;
    const list = byColumn[column];
    return (
      <section
        key={column}
        className={cn(
          "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/60",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {meta.label}
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {list.length}
          </span>
        </div>
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
          {loading && list.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : null}
          {!loading && list.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              No tickets
            </p>
          ) : null}
          {list.map((order) => renderCard(order, column))}
        </div>
      </section>
    );
  }

  return (
    <AppShell title="Kitchen Display" flush>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col bg-slate-50/50 md:h-[calc(100dvh-4rem)]">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B35]">
              Kitchen
            </p>
            <h1 className="font-display text-xl text-[#2F3E46] md:text-2xl">
              Live KDS board
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void load()}
              className="gap-1.5"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setPrepOpen(true)}
              className="gap-1.5 bg-[#2F3E46] hover:bg-[#3d4f58]"
            >
              <ClipboardList className="h-4 w-4" />
              Show Prep List
            </Button>
          </div>
        </header>

        {/* Mobile segmented tabs */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                type="button"
                onClick={() => setMobileTab(col.key)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition",
                  mobileTab === col.key
                    ? "bg-white text-[#FF6B35] shadow-sm"
                    : "text-slate-500",
                )}
              >
                {col.label}
                <span className="ml-1 text-[10px] opacity-70">
                  ({byColumn[col.key].length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop 3-column board */}
        <div className="hidden min-h-0 flex-1 grid-cols-3 gap-6 overflow-hidden p-6 lg:grid">
          {COLUMNS.map((col) => renderColumn(col.key))}
        </div>

        {/* Mobile single column */}
        <div className="min-h-0 flex-1 overflow-hidden p-4 lg:hidden">
          {renderColumn(mobileTab, "h-full")}
        </div>
      </div>

      <Drawer
        open={prepOpen}
        onClose={() => setPrepOpen(false)}
        title="Live Prep List"
        side="right"
        className="w-[min(100%,22rem)]"
      >
        <p className="mb-4 text-sm text-slate-500">
          Consolidated items from Pending and Cooking tickets.
        </p>
        {prepItems.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing to prep right now.</p>
        ) : (
          <ul className="space-y-2">
            {prepItems.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
              >
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="rounded-lg bg-[#FFF3EE] px-2.5 py-1 text-sm font-bold text-[#FF6B35]">
                  {item.qty} Total
                </span>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </AppShell>
  );
}
