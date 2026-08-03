"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Truck } from "lucide-react";
import { AddSupplierModal } from "@/components/features/inventory/AddSupplierModal";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchSuppliers } from "@/lib/inventory-api";
import { toast } from "@/store/useToastStore";
import type { Supplier } from "@/types/inventory";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSuppliers(await fetchSuppliers());
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load suppliers"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell title="Suppliers">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Raw material vendors linked to your inventory.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add supplier
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Truck className="h-10 w-10 text-[#FF6B35]" />
          <p className="mt-3 font-display text-xl text-[#2F3E46]">
            No suppliers yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add vendors before registering raw materials.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Materials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="text-[#2F3E46]">
                  <td className="px-4 py-3.5 font-semibold">{s.name}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {s.contactPerson || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {s.phone || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {s.email || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[#FF6B35]">
                    {s._count?.ingredients ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddSupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void load()}
      />
    </AppShell>
  );
}
