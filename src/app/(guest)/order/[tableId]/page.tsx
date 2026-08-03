"use client";

import { use, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { CallStaffDrawer } from "@/components/features/order/CallStaffDrawer";
import { ProductModifiersModal } from "@/components/features/pos/ProductModifiersModal";
import { useTableSession } from "@/hooks/useTableSession";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { fetchPublicMenu, type PublicTenant } from "@/lib/public-api";
import { loadQrSession, saveQrSession, type QrSession } from "@/lib/qr-session";
import { useGuestCartStore } from "@/store/useGuestCartStore";
import { toast } from "@/store/useToastStore";
import type { Category, Product } from "@/types/catalog";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function TableMenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const items = useGuestCartStore((s) => s.items);
  const addItem = useGuestCartStore((s) => s.addItem);
  const updateQuantity = useGuestCartStore((s) => s.updateQuantity);
  const removeItem = useGuestCartStore((s) => s.removeItem);
  const clear = useGuestCartStore((s) => s.clear);
  const subtotal = useGuestCartStore((s) => s.subtotal());

  const [session, setSession] = useState<QrSession | null>(null);
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const placingLocalRef = useRef(false);

  const { diners, dinerCount, connected, placing, placeSharedOrder, callWaiter } =
    useTableSession({
      session,
      onOrderPlaced: (payload) => {
        // Skip if this device initiated Place Order (handles its own navigation)
        if (placingLocalRef.current) return;
        toast(`Order ${payload.orderNumber} placed by the table!`, "success");
        setCartOpen(false);
        router.push(`/order/status/${payload.orderId}`);
      },
    });

  useEffect(() => {
    const existing = loadQrSession();
    if (!existing || existing.tableId !== tableId) {
      router.replace("/order");
      return;
    }
    setSession(existing);

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const menu = await fetchPublicMenu(existing.tenantId);
        if (cancelled) return;
        setTenant(menu.tenant);
        setCategories(menu.categories);
        setProducts(menu.products);
        saveQrSession({
          ...existing,
          restaurantName: menu.tenant.name,
        });
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load menu"), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tableId, router]);

  const filtered = useMemo(() => {
    return products.filter(
      (p) => categoryId === "all" || p.categoryId === categoryId,
    );
  }, [products, categoryId]);

  const cartCount = items.reduce((n, i) => n + i.quantity, 0);

  const handleProductTap = (product: Product) => {
    const hasVariants =
      (product.variants?.filter((v) => v.isActive).length ?? 0) > 0;
    const hasAddOns =
      (product.addOns?.filter((a) => a.isActive).length ?? 0) > 0;

    if (!hasVariants && !hasAddOns) {
      startTransition(() => {
        addItem({
          id: product.id,
          name: product.name,
          price: Number(product.price),
        });
      });
      return;
    }
    setModifierProduct(product);
  };

  const placeOrder = async () => {
    if (!session || items.length === 0 || placing || placingLocalRef.current)
      return;
    placingLocalRef.current = true;
    try {
      const order = await placeSharedOrder();
      clear();
      toast(`Order ${order.orderNumber} placed!`, "success");
      setCartOpen(false);
      router.push(`/order/status/${order.orderId}`);
    } catch (error) {
      placingLocalRef.current = false;
      toast(getApiErrorMessage(error, "Could not place order"), "error");
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B35]">
              {tenant?.name ?? session.restaurantName ?? "NexusDine"}
            </p>
            <div className="mt-0.5 flex items-end gap-3">
              <h1 className="font-display text-2xl text-[#2F3E46]">
                Digital Menu
              </h1>
              <span className="rounded-full bg-[#2F3E46] px-3 py-1 text-xs font-bold text-white">
                Table {session.tableNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStaffOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF3EE] px-3 py-2 text-xs font-bold text-[#FF6B35] shadow-sm active:scale-[0.97]"
          >
            <Bell className="h-4 w-4" />
            Call Staff
          </button>
        </div>

        {dinerCount > 0 ? (
          <div className="mt-3 flex items-center gap-2 animate-fade-in">
            <div className="flex -space-x-2">
              {diners.slice(0, 5).map((d) => (
                <span
                  key={d.guestId}
                  title={d.displayName}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: d.color }}
                >
                  {d.displayName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Users className="h-3.5 w-3.5 text-[#FF6B35]" />
              {dinerCount === 1
                ? "1 person ordering"
                : `${dinerCount} people ordering together`}
              {!connected ? (
                <span className="ml-1 text-slate-400">(connecting…)</span>
              ) : null}
            </p>
          </div>
        ) : null}
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CatPill
          label="All"
          active={categoryId === "all"}
          onClick={() => setCategoryId("all")}
        />
        {categories.map((c) => (
          <CatPill
            key={c.id}
            label={c.name}
            active={categoryId === c.id}
            onClick={() => setCategoryId(c.id)}
          />
        ))}
      </div>

      <div className="flex-1 space-y-3 px-4 pb-28">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-white/70"
              />
            ))
          : filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleProductTap(product)}
                className="flex w-full gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-transform duration-200 active:scale-[0.99]"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FF6B35]/15 to-slate-100">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#2F3E46]">
                    {product.name}
                  </p>
                  {product.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-base font-bold text-[#FF6B35]">
                    {formatLkr(Number(product.price))}
                  </p>
                </div>
              </button>
            ))}
      </div>

      {cartCount > 0 && !cartOpen ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 z-30 mx-auto flex h-14 max-w-lg items-center justify-between rounded-2xl bg-[#FF6B35] px-5 text-white shadow-2xl transition-transform active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 font-bold">
            <ShoppingCart className="h-5 w-5" />
            Shared Cart ({cartCount})
          </span>
          <span className="font-display text-xl">{formatLkr(subtotal)}</span>
        </button>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-[#2F3E46]/40 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close cart"
            className="flex-1"
            onClick={() => setCartOpen(false)}
          />
          <div className="max-h-[80dvh] animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-[#2F3E46]">
                  Shared Cart
                </h2>
                <p className="text-xs text-slate-500">
                  Everyone at this table sees the same items
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-sm font-bold text-slate-500"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-all duration-200 animate-fade-in"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#2F3E46]">
                        {item.name}
                      </p>
                      {item.variant || item.addOns.length > 0 ? (
                        <p className="text-xs text-slate-500">
                          {[
                            item.variant?.name,
                            ...item.addOns.map((a) => `+ ${a.name}`),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm font-semibold text-[#FF6B35]">
                        {formatLkr(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeItem(item.cartItemId)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-xl bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity - 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 active:bg-[#FF6B35] active:text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-10 text-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 active:bg-[#FF6B35] active:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="font-bold text-[#2F3E46]">Subtotal</span>
              <span className="font-display text-2xl text-[#2F3E46]">
                {formatLkr(subtotal)}
              </span>
            </div>

            <button
              type="button"
              disabled={placing || placingLocalRef.current || items.length === 0}
              onClick={() => void placeOrder()}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] text-base font-bold text-white active:scale-[0.99] disabled:opacity-40"
            >
              {placing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              {placing ? "Placing…" : "Place Order"}
            </button>
          </div>
        </div>
      ) : null}

      <CallStaffDrawer
        open={staffOpen}
        onClose={() => setStaffOpen(false)}
        onRequest={callWaiter}
      />

      <ProductModifiersModal
        product={modifierProduct}
        isOpen={Boolean(modifierProduct)}
        onClose={() => setModifierProduct(null)}
        onAdd={(product, variant, addOns, quantity) => {
          addItem(product, variant, addOns, quantity);
        }}
      />
    </div>
  );
}

function CatPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-4 text-sm font-bold active:scale-[0.98]",
        active
          ? "bg-[#FF6B35] text-white"
          : "bg-white text-[#2F3E46] shadow-sm",
      )}
    >
      {label}
    </button>
  );
}
