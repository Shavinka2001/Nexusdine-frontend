"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Armchair, Loader2, UtensilsCrossed } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchPublicTableById,
  lookupPublicTable,
} from "@/lib/public-api";
import { saveQrSession } from "@/lib/qr-session";
import { toast } from "@/store/useToastStore";

function QrLandingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tenantId = searchParams.get("tenantId")?.trim() ?? "";
  const branchId = searchParams.get("branchId")?.trim() ?? "";
  const tableId = searchParams.get("tableId")?.trim() ?? "";

  const [tableNumber, setTableNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvingQr, setResolvingQr] = useState(Boolean(tableId));

  const ready = useMemo(
    () => Boolean(tenantId && branchId),
    [tenantId, branchId],
  );

  // Table-bound QR codes include tableId — skip the number entry step
  useEffect(() => {
    if (!tenantId || !tableId) {
      setResolvingQr(false);
      return;
    }

    let cancelled = false;
    setResolvingQr(true);

    (async () => {
      try {
        const table = await fetchPublicTableById(
          tenantId,
          tableId,
          branchId || undefined,
        );
        if (cancelled) return;
        saveQrSession({
          tenantId,
          branchId: table.branchId,
          tableId: table.id,
          tableNumber: table.tableNumber,
          restaurantName: table.branch?.name,
        });
        toast(`Table ${table.tableNumber} ready — browse the menu`, "success");
        router.replace(`/order/${table.id}`);
      } catch (error) {
        if (!cancelled) {
          setResolvingQr(false);
          toast(
            getApiErrorMessage(error, "Could not open this table QR"),
            "error",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, branchId, tableId, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || !tableNumber.trim() || submitting) return;

    setSubmitting(true);
    try {
      const table = await lookupPublicTable(
        tenantId,
        branchId,
        tableNumber.trim(),
      );
      saveQrSession({
        tenantId,
        branchId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        restaurantName: table.branch?.name,
      });
      toast(`Table ${table.tableNumber} ready — browse the menu`, "success");
      router.push(`/order/${table.id}`);
    } catch (error) {
      toast(getApiErrorMessage(error, "Table not found"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (resolvingQr) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        <p className="mt-3 text-sm font-semibold text-slate-500">
          Opening your table…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="animate-fade-up rounded-3xl border border-white/80 bg-white/90 p-6 shadow-panel backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
          <UtensilsCrossed className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-center font-display text-3xl text-[#2F3E46]">
          Welcome to NexusDine
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
          Please enter your Table Number to view our digital menu and place
          your order.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Open this page from a restaurant QR code so we know which branch
            you&apos;re dining at.
            <p className="mt-2 text-xs text-amber-700/80">
              Expected URL:{" "}
              <code className="rounded bg-white/70 px-1">
                /order?tenantId=…&amp;branchId=…&amp;tableId=…
              </code>
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-[#2F3E46]">
                <Armchair className="h-4 w-4 text-[#FF6B35]" />
                Table Number
              </span>
              <input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. 12"
                className="h-14 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-center text-2xl font-bold tracking-wide text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !tableNumber.trim()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] text-base font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : null}
              {submitting ? "Checking…" : "View Menu"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function QrLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <QrLandingInner />
    </Suspense>
  );
}
