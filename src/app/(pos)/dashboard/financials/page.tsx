"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AddExpenseModal } from "@/components/features/financials/AddExpenseModal";
import { IncomeExpenseChart } from "@/components/features/financials/IncomeExpenseChart";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchExpenses,
  fetchFinancialSummary,
} from "@/lib/financials-api";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";
import type { Expense, FinancialSummary } from "@/types/financials";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank",
  CARD: "Card",
};

export default function FinancialsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        fetchFinancialSummary(),
        fetchExpenses(),
      ]);
      setSummary(s);
      setExpenses(e.slice(0, 25));
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load financials"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const income = summary?.totalIncome ?? 0;
  const expenseTotal = summary?.totalExpenses ?? 0;
  const net = summary?.netProfit ?? 0;
  const isProfit = net >= 0;

  return (
    <AppShell title="Financials">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Financial management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Income from completed orders vs logged expenses — net P&amp;L.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </div>

      {loading || !summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              title="Total income"
              value={formatLkr(income)}
              subtitle={`${summary.meta.completedOrders} completed orders`}
              tone="income"
              icon={<ArrowUpRight className="h-5 w-5" />}
            />
            <MetricCard
              title="Total expenses"
              value={formatLkr(expenseTotal)}
              subtitle={`${summary.meta.expenseCount} expense entries`}
              tone="expense"
              icon={<ArrowDownRight className="h-5 w-5" />}
            />
            <MetricCard
              title={isProfit ? "Net profit" : "Net loss"}
              value={formatLkr(Math.abs(net))}
              subtitle={isProfit ? "Income exceeds costs" : "Costs exceed income"}
              tone={isProfit ? "profit" : "loss"}
              icon={
                isProfit ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )
              }
            />
          </div>

          <div className="mb-6">
            <IncomeExpenseChart data={summary.monthlyTrend} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 md:px-5">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#FF6B35]" />
                <h3 className="font-display text-lg text-[#2F3E46]">
                  Recent expenses
                </h3>
              </div>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="bg-[#FF6B35] hover:bg-[#F05520]"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {expenses.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-400">
                No expenses logged yet — add your first cost entry.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id} className="text-[#2F3E46]">
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {e.category.name}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                          {e.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {PAYMENT_LABEL[e.paymentMethod] ?? e.paymentMethod}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          {formatLkr(Number(e.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void load()}
      />
    </AppShell>
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
  tone: "income" | "expense" | "profit" | "loss";
  icon: ReactNode;
}) {
  const styles = {
    income: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    expense: "border-red-200 bg-gradient-to-br from-red-50 to-white",
    profit: "border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-[#FF6B35]/5",
    loss: "border-red-300 bg-gradient-to-br from-red-50 to-white",
  } as const;

  const iconTone = {
    income: "bg-emerald-100 text-emerald-700",
    expense: "bg-red-100 text-red-700",
    profit: "bg-[#FF6B35]/15 text-[#C94216]",
    loss: "bg-red-100 text-red-700",
  } as const;

  const valueTone = {
    income: "text-emerald-700",
    expense: "text-red-700",
    profit: "text-emerald-700",
    loss: "text-red-700",
  } as const;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        styles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            iconTone[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <p className={cn("mt-3 font-display text-2xl md:text-3xl", valueTone[tone])}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
