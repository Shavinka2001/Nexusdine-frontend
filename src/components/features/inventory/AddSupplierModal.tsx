"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { createSupplier } from "@/lib/inventory-api";
import {
  createSupplierSchema,
  type CreateSupplierFormValues,
} from "@/lib/schemas/inventory";
import { toast } from "@/store/useToastStore";

interface AddSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddSupplierModal({
  open,
  onClose,
  onCreated,
}: AddSupplierModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createSupplier({
        name: values.name,
        contactPerson: values.contactPerson || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
      });
      toast("Supplier added", "success");
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not add supplier"), "error");
    }
  });

  return (
    <Modal open={open} onClose={onClose} title="Add supplier" className="max-w-md md:p-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Company name" error={errors.name?.message} {...register("name")} />
        <Input label="Contact person" error={errors.contactPerson?.message} {...register("contactPerson")} />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Address" error={errors.address?.message} {...register("address")} />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth disabled={isSubmitting} className="bg-[#FF6B35] hover:bg-[#F05520]">
            {isSubmitting ? "Saving…" : "Save supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
