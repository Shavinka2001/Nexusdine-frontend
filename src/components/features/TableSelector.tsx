"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEMO_TABLES, usePosStore } from "@/store/pos-store";
import type { DiningTable, TableStatus } from "@/types";

const statusStyles: Record<TableStatus, string> = {
  AVAILABLE: "border-emerald-300 bg-emerald-50 text-emerald-800",
  OCCUPIED: "border-primary-300 bg-primary-50 text-primary-800",
  RESERVED: "border-amber-300 bg-amber-50 text-amber-900",
  BILLING: "border-orange-300 bg-orange-50 text-orange-900",
};

const statusLabel: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  BILLING: "Billing",
};

interface TableSelectorProps {
  tables?: DiningTable[];
}

export function TableSelector({ tables = DEMO_TABLES }: TableSelectorProps) {
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const selectTable = usePosStore((s) => s.selectTable);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tables.map((table) => {
        const selected = selectedTableId === table.id;

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => selectTable(table.id)}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition",
              "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              statusStyles[table.status],
              selected && "ring-2 ring-primary ring-offset-2",
            )}
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-2xl leading-none">
                {table.tableNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-xs opacity-80">
                <Users className="h-3.5 w-3.5" />
                {table.capacity}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide">
              {statusLabel[table.status]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
