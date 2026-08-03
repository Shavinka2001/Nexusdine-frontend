"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import {
  Check,
  ChefHat,
  Loader2,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import {
  fetchPublicOrderStatus,
  getSocketUrl,
  type PublicOrderStatus,
} from "@/lib/public-api";
import { loadQrSession } from "@/lib/qr-session";
import { toast } from "@/store/useToastStore";

const STEPS = [
  {
    key: "PENDING",
    label: "Received",
    hint: "Kitchen has your order",
    icon: Sparkles,
  },
  {
    key: "PREPARING",
    label: "Cooking",
    hint: "Chef is preparing your food",
    icon: ChefHat,
  },
  {
    key: "READY",
    label: "Ready",
    hint: "On its way to your table",
    icon: UtensilsCrossed,
  },
  {
    key: "COMPLETED",
    label: "Done",
    hint: "Enjoy your meal!",
    icon: PartyPopper,
  },
] as const;

function stepIndex(status: string) {
  if (status === "CONFIRMED") return 0;
  if (status === "SERVED") return 3;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    // Audio is optional
  }
}

function formatLkr(n: string | number) {
  return `LKR ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<PublicOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const session = loadQrSession();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchPublicOrderStatus(orderId);
        if (cancelled) return;
        setOrder(data);
        setLiveMessage(data.message);
      } catch (error) {
        toast(getApiErrorMessage(error, "Could not load order"), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinOrder", { orderId });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "orderStatusUpdated",
      (payload: {
        orderId: string;
        status: string;
        message?: string;
        orderNumber?: string;
      }) => {
        if (payload.orderId !== orderId) return;
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: payload.status,
                message: payload.message ?? prev.message,
              }
            : prev,
        );
        setLiveMessage(payload.message ?? "Order updated");
        playChime();
        toast(payload.message ?? `Status: ${payload.status}`, "info");
      },
    );

    // Lightweight poll fallback if sockets drop
    const poll = window.setInterval(() => {
      void fetchPublicOrderStatus(orderId)
        .then((data) => {
          setOrder((prev) => {
            if (prev && prev.status !== data.status) {
              setLiveMessage(data.message);
              playChime();
            }
            return data;
          });
        })
        .catch(() => undefined);
    }, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      socket.emit("leaveOrder", { orderId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  const activeStep = useMemo(
    () => stepIndex(order?.status ?? "PENDING"),
    [order?.status],
  );
  const progressPct = (activeStep / (STEPS.length - 1)) * 100;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <p className="font-bold text-[#2F3E46]">Order not found</p>
        <Link
          href="/order"
          className="mt-4 text-sm font-bold text-[#FF6B35] underline"
        >
          Back to table entry
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <div className="animate-fade-up rounded-3xl border border-white/80 bg-white/95 p-6 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B35]">
              Live tracking
            </p>
            <h1 className="mt-1 font-display text-2xl text-[#2F3E46]">
              {order.orderNumber}
            </h1>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
              connected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {connected ? "Live" : "Reconnecting"}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Table {order.table?.tableNumber ?? session?.tableNumber ?? "—"} ·{" "}
          {formatLkr(order.grandTotal)}
        </p>

        {/* Progress track */}
        <div className="relative mt-8 px-2">
          <div className="absolute left-6 right-6 top-5 h-1.5 rounded-full bg-slate-100" />
          <div
            className="absolute left-6 top-5 h-1.5 rounded-full bg-[#FF6B35] transition-all duration-700 ease-out"
            style={{ width: `calc(${progressPct}% - 0px)` }}
          />
          <div className="relative grid grid-cols-4 gap-1">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const done = index <= activeStep;
              const current = index === activeStep;
              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                      done
                        ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                        : "border-slate-200 bg-white text-slate-300",
                      current && "scale-110 shadow-md shadow-[#FF6B35]/30",
                    )}
                  >
                    {done && index < activeStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-[11px] font-bold",
                      done ? "text-[#2F3E46]" : "text-slate-400",
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "mt-8 rounded-2xl border px-4 py-4 transition-colors",
            order.status === "READY" || order.status === "COMPLETED"
              ? "border-emerald-200 bg-emerald-50"
              : "border-orange-100 bg-[#FFF3EE]",
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Status
          </p>
          <p className="mt-1 text-lg font-bold text-[#2F3E46]">
            {liveMessage ?? order.message}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-600">
                {item.quantity}× {item.product.name}
              </span>
              <span className="font-semibold text-[#2F3E46]">
                {formatLkr(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        {order.status === "COMPLETED" || order.status === "SERVED" ? (
          <Link
            href={`/order/feedback/${order.id}`}
            className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#FF6B35] text-sm font-bold text-white shadow-md shadow-[#FF6B35]/25 active:scale-[0.98]"
          >
            Rate your experience
          </Link>
        ) : null}

        {session?.tableId ? (
          <Link
            href={`/order/${session.tableId}`}
            className="mt-6 flex h-12 items-center justify-center rounded-xl border-2 border-[#2F3E46] text-sm font-bold text-[#2F3E46] active:bg-slate-50"
          >
            Order more from the menu
          </Link>
        ) : null}
      </div>
    </main>
  );
}
