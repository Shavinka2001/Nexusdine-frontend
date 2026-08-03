"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchLoyaltyConfig, saveLoyaltyConfig } from "@/lib/crm-api";
import {
  loyaltyConfigSchema,
  type LoyaltyConfigFormValues,
} from "@/lib/schemas/crm";
import { toast } from "@/store/useToastStore";

export function LoyaltyConfigCard() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoyaltyConfigFormValues>({
    resolver: zodResolver(loyaltyConfigSchema),
    defaultValues: {
      spendPerPoint: 100,
      valuePerPoint: 1,
      isActive: false,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchLoyaltyConfig();
        if (cancelled) return;
        reset({
          spendPerPoint: config.spendPerPoint || 100,
          valuePerPoint: config.valuePerPoint,
          isActive: config.isActive,
        });
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load loyalty rules"), "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const pointsPerLkr =
        values.spendPerPoint > 0 ? 1 / values.spendPerPoint : 0;
      await saveLoyaltyConfig({
        pointsPerLkr: Number(pointsPerLkr.toFixed(4)),
        valuePerPoint: values.valuePerPoint,
        isActive: values.isActive,
      });
      toast("Loyalty rules saved", "success");
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not save loyalty rules"), "error");
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B35]/10">
          <Gift className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h3 className="font-display text-xl text-[#2F3E46]">
            Loyalty program rules
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Owner-only — set earn and redeem rates for your restaurant.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Spend to earn 1 point (LKR)"
          type="number"
          step="1"
          min={1}
          hint="Example: 100 means every LKR 100 spent earns 1 point"
          error={errors.spendPerPoint?.message}
          {...register("spendPerPoint", { valueAsNumber: true })}
        />
        <Input
          label="Cash value of 1 point (LKR)"
          type="number"
          step="0.01"
          min={0}
          hint="Example: 1.00 means 1 point = LKR 1.00 discount"
          error={errors.valuePerPoint?.message}
          {...register("valuePerPoint", { valueAsNumber: true })}
        />

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#2F3E46]">
              Activate loyalty program
            </p>
            <p className="text-xs text-slate-500">
              {isActive ? "Program is live at checkout" : "Program is paused"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() =>
              setValue("isActive", !isActive, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className={`relative h-8 w-14 rounded-full transition-colors ${
              isActive ? "bg-[#FF6B35]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
          fullWidth
        >
          {isSubmitting ? "Saving…" : "Save loyalty rules"}
        </Button>
      </form>
    </section>
  );
}
