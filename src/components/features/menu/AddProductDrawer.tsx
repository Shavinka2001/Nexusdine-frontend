"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { createProduct } from "@/lib/catalog-api";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "@/lib/schemas/catalog";
import { toast } from "@/store/useToastStore";
import type { Category } from "@/types/catalog";

interface AddProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: Category[];
  defaultCategoryId?: string;
}

export function AddProductDrawer({
  open,
  onClose,
  onCreated,
  categories,
  defaultCategoryId,
}: AddProductDrawerProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: defaultCategoryId || "",
      variants: [],
      addOns: [],
    },
  });

  const variants = useFieldArray({ control, name: "variants" });
  const addOns = useFieldArray({ control, name: "addOns" });

  useEffect(() => {
    if (!open) return;
    reset({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: defaultCategoryId || categories[0]?.id || "",
      variants: [],
      addOns: [],
    });
  }, [open, defaultCategoryId, categories, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createProduct({
        categoryId: values.categoryId,
        name: values.name,
        description: values.description || undefined,
        price: values.price,
        imageUrl: values.imageUrl || undefined,
        isActive: true,
        variants: values.variants?.length ? values.variants : undefined,
        addOns: values.addOns?.length ? values.addOns : undefined,
      });
      toast("Product created", "success");
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not create product"), "error");
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add product"
      className="w-[min(100%,28rem)]"
    >
      <form onSubmit={onSubmit} className="space-y-4 pb-8" noValidate>
        <Input
          label="Name"
          placeholder="Chicken Kottu"
          error={errors.name?.message}
          {...register("name")}
        />
        <label className="flex w-full flex-col gap-1.5 text-sm">
          <span className="font-medium text-secondary">Description</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-secondary-200 bg-surface-elevated px-3.5 py-3 text-base text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Optional notes for staff / online menu"
            {...register("description")}
          />
        </label>
        <Input
          label="Price (LKR)"
          type="number"
          step="0.01"
          error={errors.price?.message}
          {...register("price", { valueAsNumber: true })}
        />
        <Input
          label="Image URL"
          placeholder="https://…"
          error={errors.imageUrl?.message}
          {...register("imageUrl")}
        />
        <Select
          label="Category"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />

        <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2F3E46]">Variants</h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => variants.append({ name: "", additionalPrice: 0 })}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {variants.fields.length === 0 ? (
              <p className="text-xs text-slate-400">
                Optional — e.g. Regular / Large
              </p>
            ) : (
              variants.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    placeholder="Name"
                    error={errors.variants?.[index]?.name?.message}
                    {...register(`variants.${index}.name`)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="+Price"
                    className="max-w-28"
                    error={errors.variants?.[index]?.additionalPrice?.message}
                    {...register(`variants.${index}.additionalPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                  <button
                    type="button"
                    className="mt-1 flex min-h-12 min-w-12 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => variants.remove(index)}
                    aria-label="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2F3E46]">Add-ons</h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addOns.append({ name: "", price: 0 })}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {addOns.fields.length === 0 ? (
              <p className="text-xs text-slate-400">
                Optional — e.g. Extra cheese
              </p>
            ) : (
              addOns.fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    placeholder="Name"
                    error={errors.addOns?.[index]?.name?.message}
                    {...register(`addOns.${index}.name`)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="max-w-28"
                    error={errors.addOns?.[index]?.price?.message}
                    {...register(`addOns.${index}.price`, {
                      valueAsNumber: true,
                    })}
                  />
                  <button
                    type="button"
                    className="mt-1 flex min-h-12 min-w-12 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => addOns.remove(index)}
                    aria-label="Remove add-on"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting || categories.length === 0}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          {isSubmitting ? "Saving…" : "Create product"}
        </Button>
      </form>
    </Drawer>
  );
}
