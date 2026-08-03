"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEMO_PRODUCTS, usePosStore } from "@/store/pos-store";
import type { Product } from "@/types";

interface ProductGridProps {
  products?: Product[];
}

export function ProductGrid({ products = DEMO_PRODUCTS }: ProductGridProps) {
  const addToCart = usePosStore((s) => s.addToCart);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <article
          key={product.id}
          className="flex flex-col rounded-2xl border border-secondary-100 bg-surface-elevated p-3 shadow-sm"
        >
          <div className="mb-3 aspect-[4/3] rounded-xl bg-gradient-to-br from-primary-100 via-surface-muted to-secondary-100" />
          <h3 className="text-sm font-semibold text-secondary-900">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-secondary-400">
            {product.categoryName}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <p className="text-sm font-bold text-primary">
              LKR {product.price.toLocaleString()}
            </p>
            <Button
              size="sm"
              aria-label={`Add ${product.name}`}
              onClick={() => addToCart(product)}
              className="px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
