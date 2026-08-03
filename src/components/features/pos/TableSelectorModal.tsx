"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import {
  fetchTableFloorStatus,
  type FloorTable,
} from "@/lib/tables-api";
import { toast } from "@/store/useToastStore";

export interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string | null;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
}

const STATUS_STYLE: Record<
  FloorTable["status"],
  { card: string; badge: string; label: string; selectable: boolean }
> = {
  AVAILABLE: {
    card: "border-emerald-400 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100/80",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Available",
    selectable: true,
  },
  OCCUPIED: {
    card: "border-amber-400 bg-amber-50 hover:border-[#FF6B35] hover:bg-orange-50",
    badge: "bg-amber-100 text-amber-800",
    label: "Occupied",
    selectable: true,
  },
  BILLING: {
    card: "border-sky-400 bg-sky-50 hover:border-sky-500",
    badge: "bg-sky-100 text-sky-700",
    label: "Billing",
    selectable: true,
  },
  RESERVED: {
    card: "border-slate-200 bg-slate-50 opacity-60",
    badge: "bg-slate-100 text-slate-500",
    label: "Reserved",
    selectable: false,
  },
};

export function TableSelectorModal({
  isOpen,
  onClose,
  branchId,
  selectedTableId,
  onSelectTable,
}: TableSelectorModalProps) {
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) {
      setTables([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTableFloorStatus(branchId);
      const sorted = [...data].sort((a, b) =>
        a.tableNumber.localeCompare(b.tableNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
      setTables(sorted);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load tables"), "error");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!isOpen) return;
    void load();
  }, [isOpen, load]);

  const empty = useMemo(
    () => !loading && tables.length === 0,
    [loading, tables.length],
  );

  const handlePick = (table: FloorTable) => {
    const style = STATUS_STYLE[table.status];
    if (!style.selectable) return;
    onSelectTable(table.id);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Select Table"
      flush
      className="max-w-2xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
          Loading tables…
        </div>
      ) : empty ? (
        <p className="px-6 py-16 text-center text-sm text-slate-500">
          {branchId
            ? "No tables configured for this branch."
            : "Assign a branch before selecting a table."}
        </p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-3 gap-4 overflow-y-auto p-6 sm:grid-cols-4">
          {tables.map((table) => {
            const style = STATUS_STYLE[table.status];
            const selected = table.id === selectedTableId;
            const selectable = style.selectable;

            return (
              <button
                key={table.id}
                type="button"
                disabled={!selectable}
                onClick={() => handlePick(table)}
                className={cn(
                  "flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-none active:scale-[0.97]",
                  style.card,
                  selected && "ring-2 ring-[#2F3E46] ring-offset-2",
                  !selectable && "cursor-not-allowed",
                )}
              >
                <span className="font-display text-xl font-bold text-[#2F3E46]">
                  T{table.tableNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <Users className="h-3.5 w-3.5 text-[#FF6B35]" />
                  {table.capacity} seats
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    style.badge,
                  )}
                >
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
