"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { fetchBranches } from "@/lib/catalog-api";
import { cn } from "@/lib/cn";
import { getSocketUrl } from "@/lib/public-api";
import { normalizeRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

export interface GuestRecoveryAlert {
  branchId: string;
  tableNumber: string;
  rating: number;
  comment: string | null;
  timestamp: string;
  orderId?: string | null;
  feedbackId?: string;
}

function playWarningChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const tones = [520, 390, 520];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.24);
    });

    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* autoplay / AudioContext unavailable */
  }
}

/**
 * Live manager/owner overlay — listens for guestRecoveryAlert on branch rooms.
 */
export function GuestRecoveryAlertPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(user?.role);
  const enabled = role === "OWNER" || role === "MANAGER" || role === "WAITER";

  const [alert, setAlert] = useState<GuestRecoveryAlert | null>(null);
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

      // Owners / managers without a fixed branch join all active branches
      if (!user?.branchId || role === "OWNER" || role === "MANAGER") {
        try {
          const branches = await fetchBranches();
          for (const b of branches) ids.add(b.id);
        } catch {
          /* keep single-branch join if catalog fails */
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

    socket.on("guestRecoveryAlert", (payload: GuestRecoveryAlert) => {
      setAlert(payload);
      setFlash(true);
      playWarningChime();
      window.setTimeout(() => setFlash(false), 2400);
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

  if (!enabled || !alert) return null;

  const commentSnippet = alert.comment?.trim()
    ? `'${alert.comment.trim()}'`
    : "(no comment)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="guest-recovery-title"
    >
      <div
        className={cn(
          "absolute inset-0 bg-[#2F3E46]/70 backdrop-blur-sm transition-opacity",
          flash && "animate-pulse bg-red-900/50",
        )}
      />
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-red-500 bg-white shadow-2xl",
          flash && "animate-[pulse_0.45s_ease-in-out_4]",
        )}
      >
        <div className="bg-gradient-to-r from-red-600 to-[#FF6B35] px-5 py-3">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
            <p
              id="guest-recovery-title"
              className="text-sm font-bold uppercase tracking-wide"
            >
              Urgent guest recovery
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-[15px] leading-relaxed text-[#2F3E46]">
            <span className="font-bold text-red-600">⚠️ URGENT:</span> Negative
            experience reported at Table{" "}
            <span className="font-bold text-[#FF6B35]">
              {alert.tableNumber}
            </span>
            ! Rating:{" "}
            <span className="font-bold">{alert.rating} Stars</span>. Feedback:{" "}
            <span className="italic text-slate-600">{commentSnippet}</span>. Go
            recover the guest!
          </p>

          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {new Date(alert.timestamp).toLocaleString()}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setAlert(null);
                router.push("/dashboard/floor");
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6B35] text-sm font-bold text-white shadow-md shadow-[#FF6B35]/25 active:scale-[0.98]"
            >
              <MapPin className="h-4 w-4" />
              Go to Table
            </button>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#2F3E46] text-sm font-bold text-[#2F3E46] active:bg-slate-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Recovered
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
