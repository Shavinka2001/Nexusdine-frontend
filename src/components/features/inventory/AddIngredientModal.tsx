"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { createIngredient, fetchSuppliers } from "@/lib/inventory-api";
import {
  createIngredientSchema,
  type CreateIngredientFormValues,
} from "@/lib/schemas/inventory";
import { toast } from "@/store/useToastStore";
import type { Supplier } from "@/types/inventory";

interface AddIngredientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const UNIT_OPTIONS = [
  { value: "KG", label: "Kilograms (KG)" },
  { value: "GRAMS", label: "Grams" },
  { value: "LTR", label: "Litres (LTR)" },
  { value: "ML", label: "Millilitres (ML)" },
  { value: "PCS", label: "Pieces (PCS)" },
];

export function AddIngredientModal({
  open,
  onClose,
  onCreated,
}: AddIngredientModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateIngredientFormValues>({
    resolver: zodResolver(createIngredientSchema),
    defaultValues: {
      name: "",
      sku: "",
      unit: "KG",
      currentStock: 0,
      minStockLevel: 0,
      costPerUnit: 0,
      supplierId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingSuppliers(true);
      try {
        const data = await fetchSuppliers();
        if (!cancelled) setSuppliers(data);
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load suppliers"), "error");
      } finally {
        if (!cancelled) setLoadingSuppliers(false);
      }
    })();

    reset({
      name: "",
      sku: "",
      unit: "KG",
      currentStock: 0,
      minStockLevel: 0,
      costPerUnit: 0,
      supplierId: "",
    });

    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createIngredient({
        name: values.name,
        sku: values.sku || undefined,
        unit: values.unit,
        currentStock: values.currentStock,
        minStockLevel: values.minStockLevel,
        costPerUnit: values.costPerUnit,
        supplierId: values.supplierId || undefined,
      });
      toast("Raw material added", "success");
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not add ingredient"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add raw material"
      className="max-w-lg md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Ingredient name" placeholder="Chicken breast" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="SKU (optional)" placeholder="CHK-001" error={errors.sku?.message} {...register("sku")} />
          <Select label="Unit" options={UNIT_OPTIONS} error={errors.unit?.message} {...register("unit")} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Current stock" type="number" step="0.0001" min={0} error={errors.currentStock?.message} {...register("currentStock", { valueAsNumber: true })} />
          <Input label="Min level" type="number" step="0.0001" min={0} error={errors.minStockLevel?.message} {...register("minStockLevel", { valueAsNumber: true })} />
          <Input label="Cost / unit" type="number" step="0.01" min={0} error={errors.costPerUnit?.message} {...register("costPerUnit", { valueAsNumber: true })} />
        </div>
        <Select
          label="Supplier (optional)"
          placeholder={loadingSuppliers ? "Loading…" : "Select supplier"}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          disabled={loadingSuppliers}
          error={errors.supplierId?.message}
          {...register("supplierId")}
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth disabled={isSubmitting} className="bg-[#FF6B35] hover:bg-[#F05520]">
            {isSubmitting ? "Saving…" : "Save material"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
