"use client";

import { Clock3 } from "lucide-react";

type KotStatus = "Pending" | "Cooking" | "Ready";

interface KotTicket {
  id: string;
  table: string;
  ago: string;
  status: KotStatus;
  items: { name: string; qty: number; note?: string }[];
}

const tickets: KotTicket[] = [
  {
    id: "KOT-214",
    table: "T-04",
    ago: "2m",
    status: "Pending",
    items: [
      { name: "Chicken Kottu", qty: 2 },
      { name: "Egg Hopper", qty: 3, note: "Extra sambol" },
    ],
  },
  {
    id: "KOT-213",
    table: "T-02",
    ago: "6m",
    status: "Cooking",
    items: [
      { name: "Fish Ambul Thiyal", qty: 1 },
      { name: "Rice & Curry", qty: 2 },
    ],
  },
  {
    id: "KOT-212",
    table: "T-06",
    ago: "11m",
    status: "Ready",
    items: [
      { name: "Watalappan", qty: 2 },
      { name: "Iced Milo", qty: 4 },
    ],
  },
  {
    id: "KOT-211",
    table: "T-01",
    ago: "4m",
    status: "Cooking",
    items: [{ name: "Devilled Prawns", qty: 1, note: "Less spicy" }],
  },
  {
    id: "KOT-210",
    table: "T-08",
    ago: "1m",
    status: "Pending",
    items: [
      { name: "Vegetable Fried Rice", qty: 2 },
      { name: "Chili Paste", qty: 1 },
    ],
  },
  {
    id: "KOT-209",
    table: "Takeaway",
    ago: "9m",
    status: "Ready",
    items: [{ name: "Chicken Biryani", qty: 3 }],
  },
];

const badge: Record<KotStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Cooking: "bg-[#FF6B35]/15 text-[#C94216]",
  Ready: "bg-emerald-100 text-emerald-800",
};

const columnBorder: Record<KotStatus, string> = {
  Pending: "border-amber-200",
  Cooking: "border-[#FF6B35]/30",
  Ready: "border-emerald-200",
};

const columns: KotStatus[] = ["Pending", "Cooking", "Ready"];

export function KitchenDashboard() {
  return (
    <div className="-mx-4 -mb-24 min-h-[calc(100dvh-7.5rem)] bg-[#1C252A] px-3 pb-24 pt-1 text-white md:-mx-6 md:-mb-8 md:px-0 md:pb-0 lg:-mx-8">
      <header className="mb-4 flex items-center justify-between px-1 md:px-0">
        <div>
          <h2 className="font-display text-2xl tracking-tight md:text-3xl">
            Kitchen board
          </h2>
          <p className="text-sm text-white/55">KOT tickets · live demo data</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FF6B35]">
          {tickets.length} open
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {columns.map((status) => {
          const col = tickets.filter((t) => t.status === status);
          return (
            <section key={status} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                  {status}
                </h3>
                <span className="text-xs text-white/40">{col.length}</span>
              </div>
              <ul className="space-y-3">
                {col.map((ticket) => (
                  <li
                    key={ticket.id}
                    className={`rounded-2xl border bg-[#263238] p-4 shadow-lg ${columnBorder[status]}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{ticket.id}</p>
                        <p className="text-sm text-white/55">{ticket.table}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge[status]}`}
                        >
                          {status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-white/45">
                          <Clock3 className="h-3 w-3" />
                          {ticket.ago}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2 border-t border-white/10 pt-3">
                      {ticket.items.map((item) => (
                        <li
                          key={`${ticket.id}-${item.name}`}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <div>
                            <p className="font-medium text-white/95">
                              {item.name}
                            </p>
                            {item.note ? (
                              <p className="text-xs text-[#FF6B35]/90">
                                {item.note}
                              </p>
                            ) : null}
                          </div>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                            ×{item.qty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
