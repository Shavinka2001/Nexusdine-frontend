"use client";

import Link from "next/link";
import { CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

type FloorStatus = "Available" | "Occupied" | "Billing";

const tables: {
  id: string;
  number: string;
  guests: number;
  status: FloorStatus;
  amount?: string;
}[] = [
  { id: "1", number: "2", guests: 4, status: "Occupied", amount: "LKR 3,450" },
  { id: "2", number: "4", guests: 2, status: "Billing", amount: "LKR 1,890" },
  { id: "3", number: "5", guests: 0, status: "Available" },
  { id: "4", number: "6", guests: 6, status: "Occupied", amount: "LKR 7,200" },
  { id: "5", number: "8", guests: 0, status: "Available" },
  { id: "6", number: "9", guests: 3, status: "Billing", amount: "LKR 2,410" },
];

const statusTone: Record<FloorStatus, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Occupied: "bg-[#FF6B35]/10 text-[#C94216] border-[#FF6B35]/25",
  Billing: "bg-amber-50 text-amber-800 border-amber-200",
};

export function CashierDashboard() {
  const active = tables.filter((t) => t.status !== "Available");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46]">Cashier desk</h2>
          <p className="mt-1 text-sm text-slate-500">
            {active.length} active tables · tap to bill
          </p>
        </div>
        <Link href="/dashboard/pos">
          <Button className="bg-[#FF6B35] hover:bg-[#F05520]">
            <CreditCard className="h-4 w-4" />
            Quick Bill
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${statusTone[table.status]}`}
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-2xl">T-{table.number}</span>
              <span className="inline-flex items-center gap-1 text-xs opacity-80">
                <Users className="h-3.5 w-3.5" />
                {table.guests}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide">
              {table.status}
            </p>
            {table.amount ? (
              <p className="mt-1 text-sm font-bold">{table.amount}</p>
            ) : (
              <p className="mt-1 text-sm opacity-60">Ready to seat</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
