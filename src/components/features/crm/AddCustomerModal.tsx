"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-error";
import { upsertCustomer } from "@/lib/crm-api";
import {
  upsertCustomerSchema,
  type UpsertCustomerFormValues,
} from "@/lib/schemas/crm";
import { toast } from "@/store/useToastStore";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: AddCustomerModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertCustomerFormValues>({
    resolver: zodResolver(upsertCustomerSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsertCustomer({
        name: values.name,
        phone: values.phone.replace(/[\s()-]/g, ""),
        email: values.email || undefined,
      });
      toast("Customer saved", "success");
      reset();
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not save customer"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add / update customer"
      className="max-w-md md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="Kamal Silva"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Phone"
          placeholder="0771234567"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Email (optional)"
          type="email"
          placeholder="kamal@email.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Saving…" : "Save customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
