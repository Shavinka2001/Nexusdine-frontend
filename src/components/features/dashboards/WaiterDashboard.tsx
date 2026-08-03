"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

type TableStatus = "Available" | "Occupied" | "Billing";

const tables: {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
}[] = [
  { id: "t1", number: "1", capacity: 2, status: "Available" },
  { id: "t2", number: "2", capacity: 4, status: "Occupied" },
  { id: "t3", number: "3", capacity: 4, status: "Billing" },
  { id: "t4", number: "4", capacity: 6, status: "Available" },
  { id: "t5", number: "5", capacity: 2, status: "Occupied" },
  { id: "t6", number: "6", capacity: 8, status: "Occupied" },
  { id: "t7", number: "7", capacity: 4, status: "Available" },
  { id: "t8", number: "8", capacity: 4, status: "Billing" },
];

const statusStyles: Record<TableStatus, string> = {
  Available: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Occupied: "border-[#FF6B35]/40 bg-[#FF6B35]/10 text-[#C94216]",
  Billing: "border-amber-300 bg-amber-50 text-amber-900",
};

export function WaiterDashboard() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 md:max-w-none">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46]">Floor</h2>
          <p className="text-sm text-slate-500">Tap a table to take an order</p>
        </div>
        <Link href="/dashboard/pos" className="md:hidden">
          <Button
            size="sm"
            className="min-h-12 rounded-full bg-[#FF6B35] px-4 hover:bg-[#F05520]"
          >
            <Plus className="h-5 w-5" />
            New Order
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <Link
            key={table.id}
            href={`/dashboard/pos?table=${table.number}`}
            className={`min-h-[7.5rem] rounded-2xl border-2 p-4 transition active:scale-[0.98] ${statusStyles[table.status]}`}
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-3xl leading-none">
                {table.number}
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <Users className="h-3.5 w-3.5" />
                {table.capacity}
              </span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide">
              {table.status}
            </p>
          </Link>
        ))}
      </div>

      <div className="hidden md:block">
        <Link href="/dashboard/pos">
          <Button fullWidth className="bg-[#FF6B35] hover:bg-[#F05520]">
            <Plus className="h-5 w-5" />
            New Order
          </Button>
        </Link>
      </div>
    </div>
  );
}
