"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Bell, CheckCircle2, MapPin } from "lucide-react";
import { fetchBranches } from "@/lib/catalog-api";
import { cn } from "@/lib/cn";
import { getSocketUrl } from "@/lib/public-api";
import { normalizeRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

export interface WaiterAlert {
  branchId: string;
  tableId: string;
  tableNumber: string;
  requestType: string;
  label: string;
  timestamp: string;
  guestId?: string | null;
}

function playBellChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1174].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.1, now + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.32);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    /* ignore */
  }
}

/**
 * Staff overlay — listens for `waiterAlert` on branch rooms (WAITER / MANAGER / OWNER).
 */
export function WaiterServiceBellPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(user?.role);
  const enabled = role === "OWNER" || role === "MANAGER" || role === "WAITER";

  const [alert, setAlert] = useState<WaiterAlert | null>(null);
  const [flash, setFlash] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled || !user?.restaurantId) return;

    let cancelled = false;
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    async function joinRooms() {
      const ids = new Set<string>();
      if (user?.branchId) ids.add(user.branchId);

      if (!user?.branchId || role === "OWNER" || role === "MANAGER") {
        try {
          const branches = await fetchBranches();
          for (const b of branches) ids.add(b.id);
        } catch {
          /* keep single-branch join */
        }
      }

      if (cancelled) return;
      const list = [...ids];
      joinedRef.current = list;
      for (const branchId of list) {
        socket.emit("joinBranch", { branchId });
      }
    }

    socket.on("connect", () => {
      void joinRooms();
    });

    socket.on("waiterAlert", (payload: WaiterAlert) => {
      setAlert(payload);
      setFlash(true);
      playBellChime();
      window.setTimeout(() => setFlash(false), 2200);
    });

    void joinRooms();

    return () => {
      cancelled = true;
      for (const branchId of joinedRef.current) {
        socket.emit("leaveBranch", { branchId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, user?.restaurantId, user?.branchId, role]);

  if (!alert) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-[#2F3E46]/55 p-4 backdrop-blur-sm md:items-center",
        flash && "animate-pulse",
      )}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-[#FF6B35] px-5 py-4 text-white">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Bell className="h-4 w-4" />
            Service bell
          </p>
          <h2 className="mt-1 font-display text-2xl">{alert.label}</h2>
        </div>
        <div className="space-y-3 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#2F3E46]">
            <MapPin className="h-4 w-4 text-[#FF6B35]" />
            Table {alert.tableNumber}
          </p>
          <p className="text-sm text-slate-500">
            A guest at this table requested assistance. Head over when you can.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setAlert(null);
                router.push("/dashboard/floor");
              }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2F3E46] text-sm font-bold text-white active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Open floor
            </button>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 active:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
