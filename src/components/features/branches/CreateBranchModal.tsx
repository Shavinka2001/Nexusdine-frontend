"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { createBranch } from "@/lib/catalog-api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createBranchSchema,
  type CreateBranchFormValues,
} from "@/lib/schemas/catalog";
import { toast } from "@/store/useToastStore";

interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBranchModal({
  open,
  onClose,
  onCreated,
}: CreateBranchModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      vat: 18,
      sscl: 0,
      serviceCharge: 0,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBranch({
        name: values.name,
        address: values.address,
        phone: values.phone,
        taxConfig: {
          vat: values.vat,
          sscl: values.sscl,
          serviceCharge: values.serviceCharge,
        },
      });
      toast("Branch created successfully", "success");
      reset();
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not create branch"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create new branch"
      className="max-w-xl md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Branch name"
          placeholder="Galle Road Outlet"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Address"
          placeholder="Colombo 03"
          error={errors.address?.message}
          {...register("address")}
        />
        <Input
          label="Phone"
          placeholder="+94 11 234 5678"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="VAT %"
            type="number"
            step="0.01"
            error={errors.vat?.message}
            {...register("vat", { valueAsNumber: true })}
          />
          <Input
            label="SSCL %"
            type="number"
            step="0.01"
            error={errors.sscl?.message}
            {...register("sscl", { valueAsNumber: true })}
          />
          <Input
            label="Service %"
            type="number"
            step="0.01"
            error={errors.serviceCharge?.message}
            {...register("serviceCharge", { valueAsNumber: true })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Creating…" : "Create branch"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
