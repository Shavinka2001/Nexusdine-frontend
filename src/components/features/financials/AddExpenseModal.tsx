"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createExpense,
  fetchExpenseCategories,
} from "@/lib/financials-api";
import {
  createExpenseSchema,
  type CreateExpenseFormValues,
} from "@/lib/schemas/financials";
import { toast } from "@/store/useToastStore";
import type { ExpenseCategory } from "@/types/financials";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
];

function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AddExpenseModal({
  open,
  onClose,
  onCreated,
}: AddExpenseModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
      date: todayInputValue(),
      paymentMethod: "CASH",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingCats(true);
      try {
        const data = await fetchExpenseCategories();
        if (cancelled) return;
        setCategories(data);
        if (data[0]) {
          reset((prev) => ({
            ...prev,
            categoryId: data[0].id,
            date: todayInputValue(),
          }));
        }
      } catch (error) {
        toast(
          getApiErrorMessage(error, "Failed to load categories"),
          "error",
        );
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createExpense({
        categoryId: values.categoryId,
        amount: values.amount,
        date: new Date(values.date).toISOString(),
        paymentMethod: values.paymentMethod,
        description: values.description?.trim() || undefined,
      });
      toast("Expense logged", "success");
      reset({
        categoryId: categories[0]?.id ?? "",
        amount: 0,
        date: todayInputValue(),
        paymentMethod: "CASH",
        description: "",
      });
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not save expense"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log expense"
      className="max-w-md md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Select
          label="Category"
          placeholder={loadingCats ? "Loading…" : "Select category"}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          disabled={loadingCats || categories.length === 0}
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />
        <Input
          label="Amount (LKR)"
          type="number"
          step="0.01"
          min={0}
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />
        <Select
          label="Payment method"
          options={PAYMENT_OPTIONS}
          error={errors.paymentMethod?.message}
          {...register("paymentMethod")}
        />
        <Input
          label="Description (optional)"
          placeholder="Weekly produce delivery"
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting || loadingCats}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Saving…" : "Save expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
