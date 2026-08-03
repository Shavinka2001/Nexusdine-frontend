"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Plus, Search, Users } from "lucide-react";
import { AddCustomerModal } from "@/components/features/crm/AddCustomerModal";
import { CustomerProfileModal } from "@/components/features/crm/CustomerProfileModal";
import { LoyaltyConfigCard } from "@/components/features/crm/LoyaltyConfigCard";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchCustomers } from "@/lib/crm-api";
import { resolveAppRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import type { Customer } from "@/types/crm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CrmDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isOwner = resolveAppRole(user?.role) === "OWNER";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeProfile = useCallback(() => setSelectedId(null), []);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await fetchCustomers(q);
      setCustomers(data);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load customers"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query.trim() || undefined);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, load]);

  const empty = useMemo(
    () => !loading && customers.length === 0,
    [loading, customers.length],
  );

  return (
    <AppShell title="CRM">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Customers & loyalty
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage guest profiles and earn/redeem loyalty points.
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone…"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : empty ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <Users className="h-10 w-10 text-[#FF6B35]" />
              <p className="mt-3 font-display text-xl text-[#2F3E46]">
                No customers yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Register a guest by phone to start building loyalty.
              </p>
              <Button
                className="mt-5 bg-[#FF6B35] hover:bg-[#F05520]"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Loyalty points</th>
                      <th className="px-4 py-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer text-[#2F3E46] transition-colors hover:bg-[#FF6B35]/5"
                        onClick={() => setSelectedId(c.id)}
                      >
                        <td className="px-4 py-3.5 font-semibold">{c.name}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {c.phone}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-[#FF6B35]/10 px-2.5 py-1 text-xs font-bold text-[#C94216]">
                            {c.loyaltyPoints.toLocaleString()} pts
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {isOwner ? <LoyaltyConfigCard /> : null}
      </div>

      <AddCustomerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void load(query.trim() || undefined)}
      />
      <CustomerProfileModal
        open={!!selectedId}
        customerId={selectedId}
        onClose={closeProfile}
      />
    </AppShell>
  );
}
