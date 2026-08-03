"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, ChefHat, Plus } from "lucide-react";
import { AddIngredientModal } from "@/components/features/inventory/AddIngredientModal";
import { RecipeCreatorDrawer } from "@/components/features/inventory/RecipeCreatorDrawer";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchIngredients } from "@/lib/inventory-api";
import { toast } from "@/store/useToastStore";
import type { Ingredient } from "@/types/inventory";

function formatStock(n: number, unit: string) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit}`;
}

function formatCost(n: number) {
  return `LKR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIngredients(await fetchIngredients());
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load inventory"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const lowCount = useMemo(
    () => ingredients.filter((i) => i.isLowStock).length,
    [ingredients],
  );

  return (
    <AppShell title="Inventory">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Ingredient inventory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track raw stock levels and link menu recipes for automatic deduction.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setRecipeOpen(true)}>
            <ChefHat className="h-4 w-4" />
            Recipe creator
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            <Plus className="h-4 w-4" />
            Add raw material
          </Button>
        </div>
      </div>

      {!loading && lowCount > 0 ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {lowCount} ingredient{lowCount === 1 ? "" : "s"} at or below minimum stock level
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Boxes className="h-10 w-10 text-[#FF6B35]" />
          <p className="mt-3 font-display text-xl text-[#2F3E46]">
            No raw materials yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add flour, cheese, chicken, and other ingredients to start tracking stock.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Cost / unit</th>
                  <th className="px-4 py-3">Current stock</th>
                  <th className="px-4 py-3">Min level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingredients.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "text-[#2F3E46]",
                      item.isLowStock && "bg-red-50/60",
                    )}
                  >
                    <td className="px-4 py-3.5 font-semibold">
                      {item.name}
                      {item.sku ? (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {item.sku}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{item.unit}</td>
                    <td className="px-4 py-3.5">{formatCost(item.costPerUnit)}</td>
                    <td
                      className={cn(
                        "px-4 py-3.5 font-bold",
                        item.isLowStock ? "text-red-600" : "text-[#2F3E46]",
                      )}
                    >
                      {formatStock(item.currentStock, item.unit)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatStock(item.minStockLevel, item.unit)}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.isLowStock ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {item.supplier?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddIngredientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void load()}
      />
      <RecipeCreatorDrawer
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
      />
    </AppShell>
  );
}
