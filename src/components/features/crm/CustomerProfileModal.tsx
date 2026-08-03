"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, History } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchCustomerHistory } from "@/lib/crm-api";
import { toast } from "@/store/useToastStore";
import type { CustomerHistory } from "@/types/crm";

interface CustomerProfileModalProps {
  customerId: string | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CustomerProfileModal({
  customerId,
  open,
  onClose,
}: CustomerProfileModalProps) {
  const [profile, setProfile] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCustomerHistory(customerId);
        if (!cancelled) setProfile(data);
      } catch (error) {
        toast(
          getApiErrorMessage(error, "Failed to load customer history"),
          "error",
        );
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, customerId, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customer profile"
      className="max-h-[90dvh] max-w-lg overflow-y-auto md:p-6"
    >
      {loading || !profile ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-display text-2xl text-[#2F3E46]">
              {profile.name}
            </p>
            <p className="mt-1 text-sm text-slate-600">{profile.phone}</p>
            {profile.email ? (
              <p className="text-sm text-slate-500">{profile.email}</p>
            ) : null}
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF6B35]/10 px-3 py-2 text-sm font-bold text-[#C94216]">
              <BadgeDollarSign className="h-4 w-4" />
              {profile.loyaltyPoints.toLocaleString()} points
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2F3E46]">
              <History className="h-4 w-4 text-[#FF6B35]" />
              Loyalty history
            </div>
            {profile.transactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                No loyalty transactions yet
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {profile.transactions.map((txn) => (
                  <li
                    key={txn.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2F3E46]">
                        {txn.type === "EARNED" ? "Points earned" : "Redeemed"}
                        {txn.order?.orderNumber
                          ? ` · #${txn.order.orderNumber}`
                          : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(txn.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        txn.points >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {txn.points > 0 ? `+${txn.points}` : txn.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
