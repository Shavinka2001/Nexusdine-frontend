"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  ArrowLeft,
  ChefHat,
  ChevronRight,
  ImageIcon,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { CheckoutModal } from "@/components/features/pos/CheckoutModal";
import { CustomerSelect } from "@/components/features/pos/CustomerSelect";
import { ProductModifiersModal } from "@/components/features/pos/ProductModifiersModal";
import { TableSelectorModal } from "@/components/features/pos/TableSelectorModal";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches, fetchCategories, fetchProducts } from "@/lib/catalog-api";
import { fetchLoyaltyConfig } from "@/lib/crm-api";
import {
  createOrder,
  fetchOrders,
  updateOrderItems,
  type PosOrder,
} from "@/lib/orders-api";
import {
  fetchTableFloorStatus,
  type FloorTable,
} from "@/lib/tables-api";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartTotals, useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import type { Category, Product } from "@/types/catalog";

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function PosBillingPage() {
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const setTaxConfig = useCartStore((s) => s.setTaxConfig);
  const setLoyaltyConfig = useCartStore((s) => s.setLoyaltyConfig);
  const cartItems = useCartStore((s) => s.cartItems);
  const serviceType = useCartStore((s) => s.serviceType);
  const selectedTableId = useCartStore((s) => s.selectedTableId);
  const activeOrderId = useCartStore((s) => s.activeOrderId);
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const setServiceType = useCartStore((s) => s.setServiceType);
  const setTable = useCartStore((s) => s.setTable);
  const loadOpenOrder = useCartStore((s) => s.loadOpenOrder);
  const clearCart = useCartStore((s) => s.clearCart);
  const taxConfig = useCartStore(useShallow((s) => s.taxConfig));
  const {
    subtotal,
    vatAmount,
    ssclAmount,
    serviceChargeAmount,
    loyaltyDiscount,
    loyaltyPointsUsed,
    grandTotal,
  } = useCartStore(
    useShallow((s) => {
      const t = selectCartTotals(s);
      return {
        subtotal: t.subtotal,
        vatAmount: t.vatAmount,
        ssclAmount: t.ssclAmount,
        serviceChargeAmount: t.serviceChargeAmount,
        loyaltyDiscount: t.loyaltyDiscount,
        loyaltyPointsUsed: t.loyaltyPointsUsed,
        grandTotal: t.grandTotal,
      };
    }),
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  /** Single-view toggle below the lg breakpoint: menu OR cart fills the screen */
  const [activeView, setActiveView] = useState<"menu" | "cart">("menu");
  /** Product currently being configured in the modifiers modal */
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [floorTables, setFloorTables] = useState<FloorTable[]>([]);
  const [openOrders, setOpenOrders] = useState<PosOrder[]>([]);
  const [holding, setHolding] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleCloseCheckout = useCallback(() => {
    setCheckoutOpen(false);
  }, []);

  // Floor status + open (PENDING) orders for dine-in recall
  const refreshFloor = useCallback(async () => {
    if (!branchId) return;
    try {
      const [floor, orders] = await Promise.all([
        fetchTableFloorStatus(branchId),
        fetchOrders(branchId, "PENDING"),
      ]);
      setFloorTables(floor);
      setOpenOrders(orders);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load tables"), "error");
    }
  }, [branchId]);

  const handleSettled = useCallback(() => {
    // Cart is empty after settling — drop mobile users back on the menu
    setActiveView("menu");
    void refreshFloor();
  }, [refreshFloor]);

  useEffect(() => {
    void refreshFloor();
  }, [refreshFloor]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [cats, prods, branches, loyalty] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
          fetchBranches().catch(() => []),
          fetchLoyaltyConfig().catch(() => null),
        ]);
        if (cancelled) return;

        setCategories(cats);
        setProducts(prods.filter((p) => p.isActive));
        setLoyaltyConfig(
          loyalty
            ? {
                pointsPerLkr: loyalty.pointsPerLkr,
                valuePerPoint: loyalty.valuePerPoint,
                isActive: loyalty.isActive,
              }
            : null,
        );

        const branch =
          branches.find((b) => b.id === user?.branchId) || branches[0];
        setBranchId(user?.branchId ?? branch?.id ?? null);
        if (branch?.taxConfig) {
          const vat = Number(branch.taxConfig.vat) || 0;
          const sscl = Number(branch.taxConfig.sscl) || 0;
          const service = Number(branch.taxConfig.serviceCharge) || 0;
          const current = useCartStore.getState().taxConfig;
          if (
            current.vat !== vat ||
            current.sscl !== sscl ||
            current.serviceCharge !== service
          ) {
            setTaxConfig(vat, sscl, service);
          }
        }
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load POS catalog"), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setTaxConfig, setLoyaltyConfig, user?.branchId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = categoryId === "all" || p.categoryId === categoryId;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, categoryId, query]);

  // Most recent open order per table is resolved in handleSelectTable

  const activeOrder = useMemo(
    () => openOrders.find((o) => o.id === activeOrderId) ?? null,
    [openOrders, activeOrderId],
  );

  const selectedFloorTable = useMemo(
    () => floorTables.find((t) => t.id === selectedTableId) ?? null,
    [floorTables, selectedTableId],
  );

  const handleSelectTable = async (tableId: string) => {
    if (tableId === selectedTableId) return;

    let floor = floorTables;
    let pendingOrders = openOrders;

    if (branchId) {
      try {
        const [freshFloor, freshOrders] = await Promise.all([
          fetchTableFloorStatus(branchId),
          fetchOrders(branchId, "PENDING"),
        ]);
        floor = freshFloor;
        pendingOrders = freshOrders;
        setFloorTables(freshFloor);
        setOpenOrders(freshOrders);
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load tables"), "error");
        return;
      }
    }

    const floorTable = floor.find((t) => t.id === tableId);
    const tableNumber =
      floorTable?.tableNumber ?? floorTable?.activeOrder?.table?.tableNumber ?? "";

    const orderByTable = new Map<string, PosOrder>();
    for (const order of pendingOrders) {
      if (order.tableId && !orderByTable.has(order.tableId)) {
        orderByTable.set(order.tableId, order);
      }
    }

    const openOrder =
      orderByTable.get(tableId) ?? floorTable?.activeOrder ?? null;

    if (openOrder) {
      // Don't silently discard an unsaved bill by recalling another order
      if (cartItems.length > 0 && !activeOrderId) {
        toast(
          `Hold or clear the current bill before recalling Table ${tableNumber || openOrder.table?.tableNumber || ""}`,
          "error",
        );
        return;
      }
      loadOpenOrder(openOrder);
      toast(
        `Recalled ${openOrder.orderNumber} · Table ${tableNumber || openOrder.table?.tableNumber || ""}`,
        "info",
      );
      return;
    }

    setTable(tableId);
  };

  const activateDineIn = () => {
    setServiceType("DINE_IN");
    if (!useCartStore.getState().selectedTableId) {
      setTableModalOpen(true);
    }
  };

  // Send KOT / Hold: persist the bill as a PENDING order bound to the table
  const handleHold = async () => {
    if (holding || cartItems.length === 0 || !selectedTableId) return;
    if (!branchId) {
      toast("Assign a branch before billing", "error");
      return;
    }

    const qtyByProduct = new Map<string, number>();
    for (const item of cartItems) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    const items = [...qtyByProduct.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    setHolding(true);
    try {
      if (activeOrderId) {
        await updateOrderItems(activeOrderId, items);
        toast("Order updated — KOT sent to kitchen", "success");
      } else {
        await createOrder({
          branchId,
          tableId: selectedTableId,
          customerId: selectedCustomer?.id,
          items,
        });
        toast("Order held — KOT sent to kitchen", "success");
      }
      clearCart();
      setActiveView("menu");
      void refreshFloor();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not hold order"), "error");
    } finally {
      setHolding(false);
    }
  };

  // Instant add for plain products; open the modifiers modal otherwise
  const handleProductTap = (product: Product) => {
    const hasVariants = (product.variants?.filter((v) => v.isActive).length ?? 0) > 0;
    const hasAddOns = (product.addOns?.filter((a) => a.isActive).length ?? 0) > 0;

    if (!hasVariants && !hasAddOns) {
      startTransition(() => {
        addToCart(
          { id: product.id, name: product.name, price: Number(product.price) },
          null,
          [],
        );
      });
      return;
    }

    setModifierProduct(product);
  };

  const canHold =
    serviceType === "DINE_IN" &&
    Boolean(selectedTableId) &&
    cartItems.length > 0 &&
    !holding;
  const canSettle =
    cartItems.length > 0 &&
    (serviceType === "TAKEAWAY" || Boolean(activeOrderId));

  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <AppShell title="POS Billing" flush>
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-1 grid-rows-1 overflow-hidden bg-slate-50 lg:grid-cols-12">
        {/* Product section — full width on mobile (menu view), 8/12 on lg+ */}
        <section
          className={cn(
            "h-full min-w-0 flex-col overflow-hidden border-slate-200 lg:col-span-8 lg:flex lg:border-r",
            activeView === "menu" ? "flex w-full" : "hidden",
          )}
        >
          <div className="space-y-3 border-b border-slate-200 bg-white p-3 md:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu…"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryPill
                label="All"
                active={categoryId === "all"}
                onClick={() => setCategoryId("all")}
              />
              {categories.map((c) => (
                <CategoryPill
                  key={c.id}
                  label={c.name}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                />
              ))}
            </div>
          </div>

          {/* Extra bottom padding on mobile so the floating cart bar never covers the last row */}
          <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-3 pb-24 md:grid-cols-3 md:gap-4 md:p-4 lg:pb-4 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-2xl" />
                ))
              : filtered.map((product) => {
                  const hasModifiers =
                    (product.variants?.some((v) => v.isActive) ?? false) ||
                    (product.addOns?.some((a) => a.isActive) ?? false);
                  return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductTap(product)}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-none active:scale-[0.98] active:border-[#FF6B35]"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#FF6B35]/15 via-slate-100 to-[#2F3E46]/10">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      )}
                      {hasModifiers ? (
                        <span className="absolute right-2 top-2 rounded-full bg-[#2F3E46]/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Options
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-base font-bold leading-snug text-[#2F3E46]">
                        {product.name}
                      </p>
                      <p className="mt-2 text-lg font-bold text-[#FF6B35]">
                        {formatLkr(Number(product.price))}
                      </p>
                    </div>
                  </button>
                  );
                })}
          </div>
        </section>

        {/* Cart section — full width on mobile (cart view), 4/12 on lg+ */}
        <aside
          className={cn(
            "h-full min-w-0 flex-col overflow-hidden border-slate-200 bg-white shadow-lg lg:col-span-4 lg:flex lg:border-l",
            activeView === "cart"
              ? "flex w-full animate-fade-in"
              : "hidden",
          )}
        >
          {/* Mobile-only: back to the menu view */}
          <button
            type="button"
            onClick={() => setActiveView("menu")}
            className="flex min-h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#2F3E46] transition-colors active:bg-slate-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-[#FF6B35]" />
            Back to Menu
          </button>

          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
            <ShoppingCart className="h-5 w-5 text-[#FF6B35]" />
            <h2 className="text-lg font-bold text-[#2F3E46]">Cart</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {cartCount}
            </span>
          </div>

          {/* Service type + compact dine-in table badge */}
          <div className="shrink-0 space-y-2.5 border-b border-slate-200 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setServiceType("TAKEAWAY")}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-none active:scale-[0.98]",
                  serviceType === "TAKEAWAY"
                    ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                    : "border-slate-200 bg-white text-[#2F3E46]",
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                Takeaway
              </button>
              <button
                type="button"
                onClick={activateDineIn}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-none active:scale-[0.98]",
                  serviceType === "DINE_IN"
                    ? "border-[#2F3E46] bg-[#2F3E46] text-white"
                    : "border-slate-200 bg-white text-[#2F3E46]",
                )}
              >
                <UtensilsCrossed className="h-4 w-4" />
                Dine-In
              </button>
            </div>

            {serviceType === "DINE_IN" && selectedTableId ? (
              <button
                type="button"
                onClick={() => setTableModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-none active:bg-slate-100"
              >
                <UtensilsCrossed className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#2F3E46]">
                  Dine-In: Table T
                  {selectedFloorTable?.tableNumber ??
                    activeOrder?.table?.tableNumber ??
                    "—"}
                </span>
                <span className="cursor-pointer text-xs font-semibold underline text-[#FF6B35]">
                  Edit
                </span>
              </button>
            ) : null}

            {serviceType === "DINE_IN" && !selectedTableId ? (
              <button
                type="button"
                onClick={() => setTableModalOpen(true)}
                className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-center text-xs font-semibold text-slate-500 transition-none active:bg-slate-100"
              >
                Select a table to continue
              </button>
            ) : null}

            {activeOrder ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <RotateCcw className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-amber-800">
                  Editing {activeOrder.orderNumber}
                  {activeOrder.table
                    ? ` · Table ${activeOrder.table.tableNumber}`
                    : ""}
                </p>
                <button
                  type="button"
                  aria-label="Discard recalled order"
                  onClick={clearCart}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-600 active:bg-amber-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="shrink-0">
            <CustomerSelect />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                Tap products to start a bill
              </p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#2F3E46]">
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
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 inline-flex items-center rounded-xl bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity - 1)
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-[#2F3E46] active:bg-[#FF6B35] active:text-white"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-12 text-center text-lg font-bold text-[#2F3E46]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() =>
                        updateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-[#2F3E46] active:bg-[#FF6B35] active:text-white"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-200 p-4">
            <SummaryRow label="Subtotal" value={formatLkr(subtotal)} />
            <SummaryRow
              label={`VAT (${taxConfig.vat}%)`}
              value={formatLkr(vatAmount)}
            />
            <SummaryRow
              label={`SSCL (${taxConfig.sscl}%)`}
              value={formatLkr(ssclAmount)}
            />
            <SummaryRow
              label={`Service (${taxConfig.serviceCharge}%)`}
              value={formatLkr(serviceChargeAmount)}
            />
            {loyaltyDiscount > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-emerald-600">
                  Loyalty ({loyaltyPointsUsed.toLocaleString()} pts)
                </span>
                <span className="font-semibold text-emerald-600">
                  −{formatLkr(loyaltyDiscount)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-base font-bold text-[#2F3E46]">
                Grand Total
              </span>
              <span className="font-display text-2xl text-[#2F3E46]">
                {formatLkr(grandTotal)}
              </span>
            </div>

            <div className="mt-2 grid h-14 w-full grid-cols-2 gap-3 lg:h-16 lg:gap-2">
              <button
                type="button"
                disabled={!canHold}
                onClick={() => void handleHold()}
                className="flex min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-[#2F3E46] px-2 text-sm font-bold text-white transition-none active:scale-[0.99] disabled:opacity-40 lg:gap-2 lg:text-base"
              >
                <ChefHat className="h-5 w-5 shrink-0" />
                <span className="truncate">
                  {holding
                    ? "Sending…"
                    : activeOrderId
                      ? "Update KOT"
                      : "Send KOT"}
                </span>
              </button>
              <button
                type="button"
                disabled={!canSettle}
                onClick={() => setCheckoutOpen(true)}
                className="flex min-w-0 items-center justify-center rounded-2xl bg-[#FF6B35] px-2 text-sm font-bold text-white transition-none active:scale-[0.99] disabled:opacity-40 lg:text-base"
              >
                <span className="truncate">
                  {activeOrderId
                    ? `Settle ${formatLkr(grandTotal)}`
                    : `Pay ${formatLkr(grandTotal)}`}
                </span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile-only floating cart bar (menu view) */}
      {activeView === "menu" && cartItems.length > 0 ? (
        <button
          type="button"
          onClick={() => setActiveView("cart")}
          className="fixed bottom-0 left-0 right-0 z-50 flex h-16 cursor-pointer items-center justify-between rounded-t-2xl bg-[#FF6B35] px-6 text-white shadow-2xl transition-transform animate-fade-up active:scale-[0.99] lg:hidden"
        >
          <span className="flex items-center gap-2 text-base font-bold">
            <ShoppingCart className="h-5 w-5" />
            View Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
          </span>
          <span className="flex items-center gap-1 font-display text-xl">
            {formatLkr(grandTotal)}
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>
      ) : null}

      <TableSelectorModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        branchId={branchId}
        selectedTableId={selectedTableId}
        onSelectTable={(tableId) => {
          void handleSelectTable(tableId);
        }}
      />

      <ProductModifiersModal
        product={modifierProduct}
        isOpen={Boolean(modifierProduct)}
        onClose={() => setModifierProduct(null)}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={handleCloseCheckout}
        onSettled={handleSettled}
      />
    </AppShell>
  );
}

function CategoryPill({
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
        "min-h-12 shrink-0 rounded-full px-5 text-sm font-bold transition-none active:scale-[0.98]",
        active
          ? "bg-[#FF6B35] text-white"
          : "bg-slate-100 text-[#2F3E46]",
      )}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-[#2F3E46]">{value}</span>
    </div>
  );
}
