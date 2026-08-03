"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Plus, Tags, UtensilsCrossed } from "lucide-react";
import { AddProductDrawer } from "@/components/features/menu/AddProductDrawer";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createCategory,
  fetchCategories,
  fetchProducts,
} from "@/lib/catalog-api";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";
import type { Category, Product } from "@/types/catalog";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
      setSelectedCategoryId((current) => current ?? data[0]?.id ?? null);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load categories"), "error");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadProducts = useCallback(async (categoryId: string | null) => {
    setLoadingProducts(true);
    try {
      const data = await fetchProducts(categoryId || undefined);
      setProducts(data);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load products"), "error");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProducts(selectedCategoryId);
  }, [selectedCategoryId, loadProducts]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const onAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const created = await createCategory({ name: newCategoryName.trim() });
      toast("Category added", "success");
      setNewCategoryName("");
      await loadCategories();
      setSelectedCategoryId(created.id);
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not add category"), "error");
    } finally {
      setAddingCategory(false);
    }
  };

  return (
    <AppShell title="Menu">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Menu catalog
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize categories and products for your POS floor.
          </p>
        </div>
        <Button
          onClick={() => setDrawerOpen(true)}
          disabled={categories.length === 0}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        {/* Categories column */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Tags className="h-4 w-4 text-[#FF6B35]" />
            <h3 className="text-sm font-semibold text-[#2F3E46]">Categories</h3>
          </div>

          <form onSubmit={onAddCategory} className="mb-4 flex gap-2">
            <Input
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="min-h-11"
            />
            <Button
              type="submit"
              disabled={addingCategory || !newCategoryName.trim()}
              className="shrink-0 bg-[#2F3E46] hover:bg-[#263238]"
            >
              {addingCategory ? "…" : "Add"}
            </Button>
          </form>

          {loadingCategories ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Add your first category to start the menu.
            </p>
          ) : (
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium transition",
                      selectedCategoryId === category.id
                        ? "bg-[#FF6B35] text-white shadow-sm"
                        : "text-[#2F3E46] hover:bg-slate-50",
                    )}
                  >
                    <span className="truncate">{category.name}</span>
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-[11px]",
                        selectedCategoryId === category.id
                          ? "bg-white/20"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {category._count?.products ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Products column */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[#2F3E46]">
                {selectedCategory?.name || "Products"}
              </h3>
              <p className="text-xs text-slate-400">
                {loadingProducts
                  ? "Loading…"
                  : `${products.length} item${products.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : !selectedCategoryId ? (
            <div className="flex flex-col items-center py-16 text-center">
              <UtensilsCrossed className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                Select or create a category first.
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <UtensilsCrossed className="h-8 w-8 text-[#FF6B35]" />
              <p className="mt-3 text-sm text-slate-500">
                No products in this category yet.
              </p>
              <Button
                className="mt-4 bg-[#FF6B35] hover:bg-[#F05520]"
                onClick={() => setDrawerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/40"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#FF6B35]/15 via-slate-100 to-[#2F3E46]/10">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                    <span
                      className={cn(
                        "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        product.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600",
                      )}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="truncate text-sm font-semibold text-[#2F3E46]">
                      {product.name}
                    </h4>
                    <p className="mt-1 text-sm font-bold text-[#FF6B35]">
                      LKR {Number(product.price).toLocaleString()}
                    </p>
                    {(product.variants?.length || product.addOns?.length) ? (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {product.variants?.length
                          ? `${product.variants.length} variants`
                          : ""}
                        {product.variants?.length && product.addOns?.length
                          ? " · "
                          : ""}
                        {product.addOns?.length
                          ? `${product.addOns.length} add-ons`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        defaultCategoryId={selectedCategoryId || undefined}
        onCreated={() => void loadProducts(selectedCategoryId)}
      />
    </AppShell>
  );
}
