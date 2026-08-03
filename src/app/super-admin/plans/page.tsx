"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createSubscriptionPlan,
  fetchSubscriptionPlans,
  type SubscriptionPlan,
} from "@/lib/super-admin-api";
import { toast } from "@/store/useToastStore";

const planSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(64),
  priceMonthly: z.number().min(0, "Must be ≥ 0"),
  priceYearly: z.number().min(0, "Must be ≥ 0"),
  maxBranches: z.number().int().min(1, "At least 1 branch"),
  maxProducts: z.number().int().min(1, "At least 1 product"),
  maxUsers: z.number().int().min(1, "At least 1 user"),
});

type PlanForm = z.infer<typeof planSchema>;

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      priceMonthly: 4990,
      priceYearly: 49900,
      maxBranches: 1,
      maxProducts: 50,
      maxUsers: 5,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await fetchSubscriptionPlans());
    } catch (err) {
      toast(getApiErrorMessage(err, "Failed to load plans"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: PlanForm) {
    setSaving(true);
    try {
      const created = await createSubscriptionPlan(values);
      setPlans((prev) =>
        [...prev, created].sort((a, b) => a.priceMonthly - b.priceMonthly),
      );
      setOpen(false);
      form.reset();
      toast(`Plan "${created.name}" created`, "success");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not create plan"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35]">
            Monetization
          </p>
          <h1 className="mt-1 font-display text-3xl text-[#2F3E46]">
            Pricing plans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Package limits for branches, catalog size, and staff seats.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))
          : plans.map((plan) => (
              <article
                key={plan.id}
                className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="absolute right-4 top-4 text-[#FF6B35]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="font-display text-2xl text-slate-900">
                  {plan.name}
                </h2>
                <p className="mt-3 text-3xl font-bold text-[#FF6B35]">
                  {formatLkr(plan.priceMonthly)}
                  <span className="ml-1 text-sm font-medium text-slate-500">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  or {formatLkr(plan.priceYearly)} / year
                </p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  <li>Up to {plan.maxBranches} branches</li>
                  <li>Up to {plan.maxProducts} products</li>
                  <li>Up to {plan.maxUsers} users</li>
                  <li className="text-xs text-slate-500">
                    {plan.tenantCount} tenant
                    {plan.tenantCount === 1 ? "" : "s"} on this plan
                  </li>
                </ul>
                <span
                  className={`mt-4 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    plan.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </article>
            ))}
      </div>

      {!loading && plans.length === 0 ? (
        <p className="text-sm text-slate-500">No plans yet — create one.</p>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Plan">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 p-1"
        >
          <Input
            label="Plan name"
            {...form.register("name")}
            error={form.formState.errors.name?.message}
            placeholder="e.g. Growth"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly price"
              type="number"
              step="0.01"
              {...form.register("priceMonthly", { valueAsNumber: true })}
              error={form.formState.errors.priceMonthly?.message}
            />
            <Input
              label="Annual price"
              type="number"
              step="0.01"
              {...form.register("priceYearly", { valueAsNumber: true })}
              error={form.formState.errors.priceYearly?.message}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Max branches"
              type="number"
              {...form.register("maxBranches", { valueAsNumber: true })}
              error={form.formState.errors.maxBranches?.message}
            />
            <Input
              label="Max products"
              type="number"
              {...form.register("maxProducts", { valueAsNumber: true })}
              error={form.formState.errors.maxProducts?.message}
            />
            <Input
              label="Max users"
              type="number"
              {...form.register("maxUsers", { valueAsNumber: true })}
              error={form.formState.errors.maxUsers?.message}
            />
          </div>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create plan"
            )}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
