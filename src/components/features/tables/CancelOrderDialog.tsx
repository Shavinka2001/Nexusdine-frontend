"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

interface CancelOrderDialogProps {
  open: boolean;
  orderNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelOrderDialog({
  open,
  orderNumber,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      setReason("");
    } catch {
      /* parent shows toast; keep reason so the user can retry */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Cancel Order ${orderNumber}?`}
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This permanently voids the order for audit purposes and frees the
          table. Staff and kitchen will no longer see it as active.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#2F3E46]">
            Please provide a reason for cancelling this order (Required for
            auditing):
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Guest left, duplicate order, wrong table…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-[#2F3E46] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            className="flex h-12 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600 active:bg-slate-50 disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleConfirm()}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white active:scale-[0.99] disabled:opacity-40",
              "bg-red-600 hover:bg-red-700",
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirm Cancellation
          </button>
        </div>
      </div>
    </Modal>
  );
}
