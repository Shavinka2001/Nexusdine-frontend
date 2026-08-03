"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Armchair,
  Banknote,
  Clock3,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import {
  fetchActiveOrderByTable,
  type PosOrder,
} from "@/lib/orders-api";
import {
  fetchTableFloorStatus,
  updateTableStatus,
  type FloorTable,
} from "@/lib/tables-api";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import type { Branch } from "@/types/catalog";

function formatLkr(value: string | number) {
  return `LKR ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_STYLE: Record<
  FloorTable["status"],
  { card: string; badge: string; label: string }
> = {
  AVAILABLE: {
    card: "border-emerald-300 bg-emerald-50/60 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Available",
  },
  OCCUPIED: {
    card: "border-orange-300 bg-orange-50/70 hover:border-[#FF6B35]",
    badge: "bg-orange-100 text-orange-700",
    label: "Occupied",
  },
  RESERVED: {
    card: "border-amber-300 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-700",
    label: "Reserved",
  },
  BILLING: {
    card:
      "animate-pulse border-sky-400 bg-sky-50/80 ring-2 ring-sky-200 hover:border-sky-500",
    badge: "bg-sky-100 text-sky-700",
    label: "Billing requested",
  },
};

export default function LiveFloorPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearCart = useCartStore((state) => state.clearCart);
  const setServiceType = useCartStore((state) => state.setServiceType);
  const setTable = useCartStore((state) => state.setTable);
  const loadOpenOrder = useCartStore((state) => state.loadOpenOrder);

  const canSelectBranch =
    user?.role === "OWNER" || user?.role === "MANAGER";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(user?.branchId ?? "");
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [startTable, setStartTable] = useState<FloorTable | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [starting, setStarting] = useState(false);

  const [summaryTable, setSummaryTable] = useState<FloorTable | null>(null);
  const [summaryOrder, setSummaryOrder] = useState<PosOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    if (!canSelectBranch) {
      setBranchId(user.branchId ?? "");
      return;
    }

    (async () => {
      try {
        const data = await fetchBranches();
        if (cancelled) return;
        setBranches(data);
        setBranchId((current) => {
          if (current && data.some((branch) => branch.id === current)) {
            return current;
          }
          return user.branchId ?? data[0]?.id ?? "";
        });
      } catch (error) {
        if (!cancelled) {
          toast(getApiErrorMessage(error, "Failed to load branches"), "error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canSelectBranch, user]);

  const loadFloor = useCallback(
    async (quiet = false) => {
      if (!branchId) {
        setTables([]);
        setLoading(false);
        return;
      }

      if (quiet) setRefreshing(true);
      else setLoading(true);

      try {
        setTables(await fetchTableFloorStatus(branchId));
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load table floor"), "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [branchId],
  );

  useEffect(() => {
    void loadFloor();
  }, [loadFloor]);

  // Keep waiter and cashier terminals in sync without requiring manual refresh.
  useEffect(() => {
    if (!branchId) return;
    const timer = window.setInterval(() => void loadFloor(true), 10_000);
    return () => window.clearInterval(timer);
  }, [branchId, loadFloor]);

  const counts = useMemo(
    () =>
      tables.reduce(
        (acc, table) => {
          acc[table.status] += 1;
          return acc;
        },
        { AVAILABLE: 0, OCCUPIED: 0, RESERVED: 0, BILLING: 0 },
      ),
    [tables],
  );

  const openStartModal = (table: FloorTable) => {
    setGuestCount(Math.min(2, table.capacity));
    setStartTable(table);
  };

  const proceedToOrder = async () => {
    if (!startTable || starting) return;
    setStarting(true);
    try {
      await updateTableStatus(startTable.id, {
        status: "OCCUPIED",
        guestCount,
      });
      clearCart();
      setServiceType("DINE_IN");
      setTable(startTable.id);
      toast(`Table ${startTable.tableNumber} seated`, "success");
      router.push("/dashboard/pos");
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not start table"), "error");
    } finally {
      setStarting(false);
    }
  };

  const openOrderSummary = async (table: FloorTable) => {
    setSummaryTable(table);
    setSummaryOrder(table.activeOrder);

    if (!table.activeOrder) return;
    setLoadingOrder(true);
    try {
      setSummaryOrder(await fetchActiveOrderByTable(table.id));
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not load active order"), "error");
    } finally {
      setLoadingOrder(false);
    }
  };

  const addItems = () => {
    if (!summaryTable) return;
    clearCart();
    if (summaryOrder) {
      loadOpenOrder(summaryOrder);
    } else {
      setServiceType("DINE_IN");
      setTable(summaryTable.id);
    }
    router.push("/dashboard/pos");
  };

  const requestBill = async () => {
    if (!summaryTable || requestingBill) return;
    setRequestingBill(true);
    try {
      await updateTableStatus(summaryTable.id, { status: "BILLING" });
      toast(
        `Bill requested for Table ${summaryTable.tableNumber}`,
        "success",
      );
      setSummaryTable(null);
      setSummaryOrder(null);
      await loadFloor(true);
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not request bill"), "error");
    } finally {
      setRequestingBill(false);
    }
  };

  return (
    <AppShell title="Live Floor">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
              Live table floor
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Seat guests, recall active orders, and request bills.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing || !branchId}
            onClick={() => void loadFloor(true)}
            className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#2F3E46] shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        {canSelectBranch ? (
          <div className="mb-5 max-w-sm">
            <Select
              label="Branch"
              value={branchId}
              placeholder="Select a branch"
              options={branches.map((branch) => ({
                value: branch.id,
                label: `${branch.name} (${branch.code})`,
              }))}
              onChange={(event) => setBranchId(event.target.value)}
            />
          </div>
        ) : !branchId ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Your account is not assigned to a branch. Ask a manager to assign
            one before using the floor.
          </div>
        ) : null}

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatusCount label="Available" value={counts.AVAILABLE} tone="green" />
          <StatusCount label="Occupied" value={counts.OCCUPIED} tone="orange" />
          <StatusCount label="Reserved" value={counts.RESERVED} tone="yellow" />
          <StatusCount label="Billing" value={counts.BILLING} tone="blue" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Armchair className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-[#2F3E46]">
              No tables configured
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add tables in Table setup to populate this floor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tables.map((table) => {
              const style = STATUS_STYLE[table.status];
              const actionable =
                table.status === "AVAILABLE" ||
                table.status === "OCCUPIED" ||
                table.status === "BILLING";

              return (
                <button
                  key={table.id}
                  type="button"
                  disabled={!actionable}
                  onClick={() => {
                    if (table.status === "AVAILABLE") openStartModal(table);
                    else void openOrderSummary(table);
                  }}
                  className={cn(
                    "relative flex min-h-48 flex-col rounded-2xl border-2 p-4 text-left shadow-sm transition duration-200",
                    style.card,
                    actionable
                      ? "active:scale-[0.98]"
                      : "cursor-default opacity-80",
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="font-display text-3xl text-[#2F3E46]">
                      {table.tableNumber}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                        style.badge,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <Users className="h-4 w-4" />
                    {table.status === "AVAILABLE"
                      ? `${table.capacity} seats`
                      : `${table.guestCount} guest${table.guestCount === 1 ? "" : "s"}`}
                  </div>

                  {table.activeOrder ? (
                    <div className="mt-2">
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {table.activeOrder.orderNumber}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-[#2F3E46]">
                        {formatLkr(table.activeOrder.grandTotal)}
                      </p>
                    </div>
                  ) : null}

                  <span
                    className={cn(
                      "mt-auto flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold",
                      table.status === "AVAILABLE"
                        ? "bg-emerald-600 text-white"
                        : table.status === "BILLING"
                          ? "bg-sky-600 text-white"
                          : table.status === "OCCUPIED"
                            ? "bg-[#FF6B35] text-white"
                            : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {table.status === "AVAILABLE" ? (
                      <>
                        <Plus className="h-4 w-4" /> Start Order
                      </>
                    ) : table.status === "OCCUPIED" ? (
                      <>
                        <ReceiptText className="h-4 w-4" /> View Order
                      </>
                    ) : table.status === "BILLING" ? (
                      <>
                        <Banknote className="h-4 w-4" /> Bill Requested
                      </>
                    ) : (
                      <>
                        <Clock3 className="h-4 w-4" /> Reserved
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(startTable)}
        title={
          startTable ? `Start Table ${startTable.tableNumber}` : "Start Order"
        }
        onClose={() => setStartTable(null)}
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="guest-count"
              className="text-sm font-bold text-[#2F3E46]"
            >
              Guest Count
            </label>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease guest count"
                onClick={() => setGuestCount((value) => Math.max(1, value - 1))}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-[#2F3E46] active:bg-slate-200"
              >
                −
              </button>
              <input
                id="guest-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={startTable?.capacity ?? 1}
                value={guestCount}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setGuestCount(
                    Math.min(
                      startTable?.capacity ?? 1,
                      Math.max(1, Number.isFinite(value) ? value : 1),
                    ),
                  );
                }}
                className="h-14 min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white text-center text-2xl font-bold text-[#2F3E46] outline-none focus:border-[#FF6B35]"
              />
              <button
                type="button"
                aria-label="Increase guest count"
                onClick={() =>
                  setGuestCount((value) =>
                    Math.min(startTable?.capacity ?? value, value + 1),
                  )
                }
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-[#2F3E46] active:bg-slate-200"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Capacity: {startTable?.capacity ?? 0} guests
            </p>
          </div>

          <button
            type="button"
            disabled={starting}
            onClick={() => void proceedToOrder()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] text-base font-bold text-white active:scale-[0.99] disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UtensilsCrossed className="h-5 w-5" />
            )}
            {starting ? "Opening Table…" : "Proceed to Order"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(summaryTable)}
        title={
          summaryTable
            ? `Table ${summaryTable.tableNumber} · ${summaryTable.guestCount} guests`
            : "Active Order"
        }
        onClose={() => {
          setSummaryTable(null);
          setSummaryOrder(null);
        }}
        className="max-h-[90dvh] overflow-y-auto"
      >
        {loadingOrder ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
          </div>
        ) : (
          <div className="space-y-4">
            {summaryOrder ? (
              <>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {summaryOrder.orderNumber}
                  </span>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase text-orange-700">
                    {summaryOrder.status}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {summaryOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#2F3E46]">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × {formatLkr(item.unitPrice)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#2F3E46]">
                        {formatLkr(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#2F3E46] px-4 py-3 text-white">
                  <span className="text-sm font-semibold text-white/70">
                    Total due
                  </span>
                  <span className="font-display text-2xl">
                    {formatLkr(summaryOrder.grandTotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <p className="font-bold text-[#2F3E46]">No items sent yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Continue to POS to add this table’s first items.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={addItems}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-3 text-sm font-bold text-white active:scale-[0.99]"
              >
                <Plus className="h-5 w-5" />
                Add Items
              </button>
              <button
                type="button"
                disabled={!summaryOrder || requestingBill}
                onClick={() => void requestBill()}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-40"
              >
                {requestingBill ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Banknote className="h-5 w-5" />
                )}
                Request Bill
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

function StatusCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "orange" | "yellow" | "blue";
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <div className={cn("rounded-xl border px-3 py-2", tones[tone])}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">
        {label}
      </p>
    </div>
  );
}
