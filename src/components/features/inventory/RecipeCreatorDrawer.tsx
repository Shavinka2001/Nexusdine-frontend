"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchProducts } from "@/lib/catalog-api";
import {
  fetchIngredients,
  fetchProductRecipe,
  saveProductRecipe,
} from "@/lib/inventory-api";
import { recipeSchema, type RecipeFormValues } from "@/lib/schemas/inventory";
import { toast } from "@/store/useToastStore";
import type { Ingredient } from "@/types/inventory";
import type { Product } from "@/types/catalog";

interface RecipeCreatorDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RecipeCreatorDrawer({ open, onClose }: RecipeCreatorDrawerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      productId: "",
      items: [{ ingredientId: "", quantityRequired: 1 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const productId = watch("productId");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingMeta(true);
      try {
        const [prods, ings] = await Promise.all([
          fetchProducts(),
          fetchIngredients(),
        ]);
        if (cancelled) return;
        setProducts(prods.filter((p) => p.isActive));
        setIngredients(ings);
        reset({
          productId: prods[0]?.id ?? "",
          items: [{ ingredientId: ings[0]?.id ?? "", quantityRequired: 1 }],
        });
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load recipe data"), "error");
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;

    (async () => {
      try {
        const recipe = await fetchProductRecipe(productId);
        if (cancelled) return;
        if (recipe.items.length > 0) {
          replace(
            recipe.items.map((line) => ({
              ingredientId: line.ingredientId,
              quantityRequired: line.quantityRequired,
            })),
          );
        } else {
          replace([
            {
              ingredientId: ingredients[0]?.id ?? "",
              quantityRequired: 1,
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          replace([
            {
              ingredientId: ingredients[0]?.id ?? "",
              quantityRequired: 1,
            },
          ]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productId, ingredients, replace]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveProductRecipe(values.productId, {
        items: values.items.map((line) => ({
          ingredientId: line.ingredientId,
          quantityRequired: line.quantityRequired,
        })),
      });
      toast("Recipe saved — stock will deduct on order completion", "success");
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not save recipe"), "error");
    }
  });

  const ingredientOptions = ingredients.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  return (
    <Drawer open={open} onClose={onClose} title="Recipe creator" side="right">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Select
          label="Menu product"
          options={products.map((p) => ({ value: p.id, label: p.name }))}
          disabled={loadingMeta || products.length === 0}
          error={errors.productId?.message}
          {...register("productId")}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2F3E46]">
              Ingredients per 1 unit sold
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                append({
                  ingredientId: ingredients[0]?.id ?? "",
                  quantityRequired: 1,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_7rem_auto] items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <Select
                label={index === 0 ? "Ingredient" : undefined}
                options={ingredientOptions}
                error={errors.items?.[index]?.ingredientId?.message}
                {...register(`items.${index}.ingredientId`)}
              />
              <Input
                label={index === 0 ? "Qty" : undefined}
                type="number"
                step="0.0001"
                min={0.0001}
                error={errors.items?.[index]?.quantityRequired?.message}
                {...register(`items.${index}.quantityRequired`, {
                  valueAsNumber: true,
                })}
              />
              <button
                type="button"
                aria-label="Remove line"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 disabled:opacity-30 active:bg-red-50 active:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {errors.items?.message ? (
            <p className="text-xs text-red-600">{errors.items.message}</p>
          ) : null}
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting || loadingMeta}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Saving…" : "Save recipe"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
