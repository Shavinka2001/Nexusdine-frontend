import { Building2, Phone, Percent } from "lucide-react";
import type { Branch } from "@/types/catalog";

function taxValue(config: Branch["taxConfig"], key: string) {
  const value = config?.[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

export function BranchCard({ branch }: { branch: Branch }) {
  const vat = taxValue(branch.taxConfig, "vat");
  const sscl = taxValue(branch.taxConfig, "sscl");
  const service = taxValue(branch.taxConfig, "serviceCharge");

  return (
    <article className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/10 text-[#FF6B35]">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl text-[#2F3E46]">
              {branch.name}
            </h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {branch.code}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            branch.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {branch.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {branch.address || "No address set"}
      </p>

      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
        <Phone className="h-3.5 w-3.5" />
        {branch.phone || "—"}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {[
          { label: "VAT", value: vat },
          { label: "SSCL", value: sscl },
          { label: "Service", value: service },
        ].map((tax) => (
          <div
            key={tax.label}
            className="rounded-xl bg-slate-50 px-2 py-2 text-center"
          >
            <p className="inline-flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <Percent className="h-3 w-3" />
              {tax.label}
            </p>
            <p className="mt-1 text-sm font-bold text-[#2F3E46]">
              {tax.value}%
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
