"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Plus, QrCode, Trash2, Users } from "lucide-react";
import { AddTableModal } from "@/components/features/tables/AddTableModal";
import { TableQrModal } from "@/components/features/tables/TableQrModal";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import { deleteTable, fetchTablesByBranch } from "@/lib/tables-api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import type { Branch } from "@/types/catalog";
import type { ConfigTable } from "@/types/table-config";

export default function TableConfigurationPage() {
  const tenantId = useAuthStore((s) => s.user?.restaurantId ?? "");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [tables, setTables] = useState<ConfigTable[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<ConfigTable | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingBranches(true);
      try {
        const data = await fetchBranches();
        if (cancelled) return;
        setBranches(data);
        if (data[0]) setBranchId(data[0].id);
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load branches"), "error");
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTables = useCallback(async (id: string) => {
    if (!id) {
      setTables([]);
      return;
    }
    setLoadingTables(true);
    try {
      const data = await fetchTablesByBranch(id);
      setTables(data);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load tables"), "error");
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    void loadTables(branchId);
  }, [branchId, loadTables]);

  const onRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await deleteTable(id);
      toast("Table removed", "success");
      await loadTables(branchId);
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not remove table"), "error");
    } finally {
      setRemovingId(null);
    }
  };

  const sortedTables = [...tables].sort((a, b) =>
    a.tableNumber.localeCompare(b.tableNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <AppShell title="Table setup">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Table configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage seating for each branch — number, capacity, and QR ordering
            codes.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          disabled={!branchId}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      </div>

      <div className="mb-6 max-w-md">
        <Select
          label="Branch"
          placeholder={
            loadingBranches ? "Loading branches…" : "Select a branch"
          }
          options={branches.map((b) => ({
            value: b.id,
            label: `${b.name} (${b.code})`,
          }))}
          value={branchId}
          disabled={loadingBranches || branches.length === 0}
          onChange={(e) => setBranchId(e.target.value)}
        />
      </div>

      {loadingBranches || loadingTables ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : !branchId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          Create a branch before configuring tables.
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <LayoutGrid className="h-10 w-10 text-[#FF6B35]" />
          <p className="mt-3 font-display text-xl text-[#2F3E46]">
            No tables for this branch
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add tables with seating capacity for the floor plan.
          </p>
          <Button
            className="mt-5 bg-[#FF6B35] hover:bg-[#F05520]"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {sortedTables.map((table) => (
            <div
              key={table.id}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="font-display text-2xl text-[#2F3E46]">
                {table.tableNumber}
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <Users className="h-4 w-4 text-[#FF6B35]" />
                {table.capacity} seats
              </span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {table.status}
              </span>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrTable(table)}
                  className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FF6B35]/10 px-2 text-xs font-bold text-[#FF6B35] active:bg-[#FF6B35] active:text-white"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </button>
                <button
                  type="button"
                  aria-label={`Remove table ${table.tableNumber}`}
                  disabled={removingId === table.id}
                  onClick={() => void onRemove(table.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-none active:bg-red-50 active:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTableModal
        open={modalOpen}
        branchId={branchId}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadTables(branchId)}
      />

      <TableQrModal
        table={qrTable}
        tenantId={tenantId}
        isOpen={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
      />
    </AppShell>
  );
}
