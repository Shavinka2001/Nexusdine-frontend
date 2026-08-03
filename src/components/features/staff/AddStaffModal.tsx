"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import {
  createStaffSchema,
  type CreateStaffFormValues,
} from "@/lib/schemas/staff";
import { createStaff } from "@/lib/staff-api";
import { toast } from "@/store/useToastStore";
import type { Branch } from "@/types/catalog";

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Manager" },
  { value: "CASHIER", label: "Cashier" },
  { value: "WAITER", label: "Waiter" },
  { value: "CHEF", label: "Chef / Kitchen" },
];

export function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "WAITER",
      branchId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingBranches(true);
      try {
        const data = await fetchBranches();
        if (cancelled) return;
        setBranches(data);
        if (data[0]) {
          reset((prev) => ({ ...prev, branchId: data[0].id }));
        }
      } catch (error) {
        toast(getApiErrorMessage(error, "Failed to load branches"), "error");
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createStaff(values);
      toast("Staff member added", "success");
      reset({
        name: "",
        email: "",
        password: "",
        role: "WAITER",
        branchId: branches[0]?.id ?? "",
      });
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not add staff"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add staff member"
      className="max-w-lg md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="Nimal Perera"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="nimal@restaurant.lk"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          {...register("role")}
        />
        <Select
          label="Assigned branch"
          placeholder={loadingBranches ? "Loading branches…" : "Select branch"}
          options={branches.map((b) => ({
            value: b.id,
            label: `${b.name} (${b.code})`,
          }))}
          disabled={loadingBranches || branches.length === 0}
          error={errors.branchId?.message}
          {...register("branchId")}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting || loadingBranches}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Saving…" : "Add staff"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
