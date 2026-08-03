"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Printer, UtensilsCrossed, Zap } from "lucide-react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { fetchMe } from "@/lib/auth-api";
import { useAuthStore } from "@/store/useAuthStore";
import type { ConfigTable } from "@/types/table-config";

export interface TableQrModalProps {
  table: ConfigTable | null;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TableQrModal({
  table,
  tenantId,
  isOpen,
  onClose,
}: TableQrModalProps) {
  const restaurantName = useAuthStore((s) => s.user?.restaurantName);
  const logoUrl = useAuthStore((s) => s.user?.logoUrl);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(restaurantName ?? "");
  const [brandLogo, setBrandLogo] = useState<string | null>(logoUrl ?? null);

  // Resolve restaurant branding for older sessions that predate the fields
  useEffect(() => {
    if (!isOpen) return;
    if (restaurantName) {
      setBrandName(restaurantName);
      setBrandLogo(logoUrl ?? null);
      return;
    }

    let cancelled = false;
    void fetchMe()
      .then((profile) => {
        if (cancelled) return;
        const settings = profile.tenant?.settings;
        const logo =
          settings &&
          typeof settings === "object" &&
          "logoUrl" in settings &&
          typeof (settings as { logoUrl?: unknown }).logoUrl === "string"
            ? (settings as { logoUrl: string }).logoUrl
            : null;
        const name = profile.tenant?.name ?? "Your Restaurant";
        setBrandName(name);
        setBrandLogo(logo);
        patchUser({ restaurantName: name, logoUrl: logo });
      })
      .catch(() => {
        if (!cancelled) setBrandName("Your Restaurant");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, restaurantName, logoUrl, patchUser]);

  useEffect(() => {
    if (!isOpen || !table || !tenantId) {
      setDataUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const url = `${window.location.origin}/order?tenantId=${encodeURIComponent(tenantId)}&branchId=${encodeURIComponent(table.branchId)}&tableId=${encodeURIComponent(table.id)}`;
    setGenerating(true);
    setError(null);

    void QRCode.toDataURL(url, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#2F3E46",
        light: "#FFFFFF",
      },
    })
      .then((png) => {
        if (!cancelled) setDataUrl(png);
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate QR code");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, table, tenantId]);

  const downloadPng = () => {
    if (!dataUrl || !table) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `nexusdine-table-${table.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={table ? `QR · Table ${table.tableNumber}` : "Table QR"}
        flush
        className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-2xl print:hidden"
      >
        {/* Scrollable tent-card preview */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex justify-center">
            <TentCardPreview
              restaurantName={brandName || "Your Restaurant"}
              logoUrl={brandLogo}
              tableNumber={table?.tableNumber ?? "—"}
              dataUrl={dataUrl}
              generating={generating}
              error={error}
            />
          </div>
        </div>

        {/* Sticky action footer — always visible */}
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/80 p-4 backdrop-blur-md print:hidden">
          <button
            type="button"
            disabled={!dataUrl}
            onClick={downloadPng}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#2F3E46] text-sm font-bold text-[#2F3E46] active:scale-[0.98] disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
          <button
            type="button"
            disabled={!dataUrl}
            onClick={() => window.print()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF6B35] text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Print Card
          </button>
        </div>
      </Modal>

      {/* Print-only tent card */}
      {isOpen && table ? (
        <div
          className="pointer-events-none fixed left-[-9999px] top-0 opacity-0 print:pointer-events-auto print:static print:left-auto print:opacity-100"
          aria-hidden
        >
          <div className="print-qr-root hidden print:flex print:min-h-screen print:items-center print:justify-center print:bg-white">
            <TentCardPreview
              restaurantName={brandName || "Your Restaurant"}
              logoUrl={brandLogo}
              tableNumber={table.tableNumber}
              dataUrl={dataUrl}
              generating={false}
              error={null}
              printMode
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function TentCardPreview({
  restaurantName,
  logoUrl,
  tableNumber,
  dataUrl,
  generating,
  error,
  printMode,
}: {
  restaurantName: string;
  logoUrl: string | null;
  tableNumber: string;
  dataUrl: string | null;
  generating: boolean;
  error: string | null;
  printMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[260px] flex-col items-center space-y-4 rounded-2xl border-2 border-[#2F3E46]/10 bg-white p-5 shadow-panel sm:max-w-[280px] sm:p-6",
        printMode &&
          "print:max-w-none print:w-[100mm] print:space-y-5 print:rounded-none print:border-0 print:p-8 print:shadow-none",
      )}
    >
      {/* Dynamic restaurant brand mark */}
      <div className="flex flex-col items-center space-y-2 text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-[#FF6B35]/20 print:h-[18mm] print:w-[18mm]"
          />
        ) : (
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              "bg-gradient-to-br from-[#2F3E46] via-[#3F505C] to-[#C9A227]",
              "text-white shadow-md print:h-[18mm] print:w-[18mm]",
            )}
          >
            <UtensilsCrossed className="h-6 w-6 print:h-6 print:w-6" />
          </div>
        )}

        <h2 className="max-w-[220px] font-display text-lg font-bold leading-snug text-slate-800 sm:text-xl print:text-2xl">
          {restaurantName}
        </h2>
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Digital Menu
        </p>
      </div>

      {/* Compact QR — scales down on short screens */}
      <div className="flex h-[160px] w-[160px] shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-2.5 sm:h-[180px] sm:w-[180px] print:h-[55mm] print:w-[55mm]">
        {generating ? (
          <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
        ) : error ? (
          <p className="px-3 text-center text-xs text-red-500">{error}</p>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR code for table ${tableNumber}`}
            className="h-full w-full object-contain"
          />
        ) : null}
      </div>

      <div className="flex flex-col items-center space-y-1.5 text-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#2F3E46] sm:text-sm">
          Scan to Order
        </p>
        <p className="font-display text-2xl text-[#FF6B35] sm:text-3xl print:text-4xl">
          TABLE {tableNumber}
        </p>
        <p className="max-w-[220px] text-[11px] leading-relaxed text-slate-400">
          Point your camera at the code to open the menu and place your order.
        </p>
      </div>

      <p className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest text-slate-400">
        <Zap className="h-2.5 w-2.5 text-[#FF6B35]" />
        Powered by NexusDine
      </p>
    </div>
  );
}
