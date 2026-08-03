"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Receipt,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const analytics = [
  {
    label: "Total Revenue",
    value: "LKR 248,500",
    delta: "+12.4%",
    icon: Wallet,
    hint: "Today vs yesterday",
  },
  {
    label: "Orders",
    value: "186",
    delta: "+8.1%",
    icon: ShoppingBag,
    hint: "Completed tickets",
  },
  {
    label: "Average Bill",
    value: "LKR 1,336",
    delta: "+3.2%",
    icon: Receipt,
    hint: "Per covered guest",
  },
];

const chartBars = [42, 58, 47, 73, 66, 88, 74, 91, 80, 95, 70, 84];

export function OwnerDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
          Welcome back, {user?.firstName || user?.name?.split(" ")[0] || "Owner"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sales overview for {user?.branchName || "your branch"}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/branches"
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-[#FF6B35]/40 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35]">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#2F3E46]">Branches</p>
            <p className="text-xs text-slate-400">Outlets & tax config</p>
          </div>
        </Link>
        <Link
          href="/dashboard/menu"
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-[#FF6B35]/40 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F3E46]/10 text-[#2F3E46]">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#2F3E46]">Menu catalog</p>
            <p className="text-xs text-slate-400">Categories & products</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
        {analytics.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-2xl text-[#2F3E46] md:text-3xl">
                    {card.value}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {card.delta}
                <span className="font-normal text-slate-400"> · {card.hint}</span>
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#2F3E46]">
                Revenue trend
              </h3>
              <p className="text-xs text-slate-400">Last 12 service windows</p>
            </div>
            <span className="rounded-full bg-[#FF6B35]/10 px-2.5 py-1 text-[11px] font-semibold text-[#FF6B35]">
              Live demo
            </span>
          </div>
          <div className="flex h-44 items-end gap-1.5 sm:gap-2">
            {chartBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[#FF6B35]/30 to-[#FF6B35] transition-all"
                style={{ height: `${h}%` }}
                title={`${h}%`}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <h3 className="text-sm font-semibold text-[#2F3E46]">Top sellers</h3>
          <p className="mb-4 text-xs text-slate-400">Placeholder ranking</p>
          <ul className="space-y-3">
            {[
              { name: "Chicken Kottu", qty: 64, share: "28%" },
              { name: "Fish Ambul Thiyal", qty: 41, share: "18%" },
              { name: "Iced Milo", qty: 89, share: "15%" },
            ].map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-[#2F3E46]">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">{item.qty} sold</p>
                </div>
                <span className="text-sm font-semibold text-[#FF6B35]">
                  {item.share}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
