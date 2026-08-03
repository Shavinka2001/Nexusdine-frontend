"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEMO_TABLES, usePosStore } from "@/store/pos-store";

export function OrderCart() {
  const cart = usePosStore((s) => s.cart);
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const clearCart = usePosStore((s) => s.clearCart);
  const total = usePosStore((s) => s.cartTotal());

  const table = DEMO_TABLES.find((t) => t.id === selectedTableId);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-secondary-100 bg-surface-elevated shadow-sm">
      <div className="border-b border-secondary-100 px-4 py-3">
        <h2 className="font-display text-lg text-secondary-900">Order</h2>
        <p className="text-xs text-secondary-400">
          {table ? `Table ${table.tableNumber}` : "No table selected"}
        </p>
      </div>

      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <li className="py-8 text-center text-sm text-secondary-400">
            Tap products to build an order
          </li>
        ) : (
          cart.map((item) => (
            <li
              key={item.localId}
              className="flex items-start justify-between gap-2 border-b border-secondary-50 pb-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-secondary-900">
                  {item.name}
                </p>
                <p className="text-xs text-secondary-400">
                  LKR {item.unitPrice.toLocaleString()}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-surface-muted p-0.5">
                  <button
                    type="button"
                    className="rounded-md p-1.5 hover:bg-white"
                    onClick={() =>
                      updateQuantity(item.localId, item.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="rounded-md p-1.5 hover:bg-white"
                    onClick={() =>
                      updateQuantity(item.localId, item.quantity + 1)
                    }
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-secondary-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => removeFromCart(item.localId)}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="space-y-3 border-t border-secondary-100 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">Total</span>
          <span className="text-lg font-bold text-secondary-900">
            LKR {total.toLocaleString()}
          </span>
        </div>
        <Button fullWidth disabled={cart.length === 0}>
          Send to Kitchen
        </Button>
        <Button
          fullWidth
          variant="ghost"
          size="sm"
          disabled={cart.length === 0}
          onClick={clearCart}
        >
          Clear
        </Button>
      </div>
    </section>
  );
}
