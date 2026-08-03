"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createTableSchema,
  type CreateTableFormValues,
} from "@/lib/schemas/table-config";
import { createTable } from "@/lib/tables-api";
import { toast } from "@/store/useToastStore";

interface AddTableModalProps {
  open: boolean;
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AddTableModal({
  open,
  branchId,
  onClose,
  onCreated,
}: AddTableModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      tableNumber: "",
      capacity: 4,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTable({
        branchId,
        tableNumber: values.tableNumber.trim(),
        capacity: values.capacity,
      });
      toast("Table added", "success");
      reset({ tableNumber: "", capacity: 4 });
      onCreated();
      onClose();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not add table"), "error");
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add table"
      className="max-w-md md:p-6"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Table number / name"
          placeholder="T-12"
          error={errors.tableNumber?.message}
          {...register("tableNumber")}
        />
        <Input
          label="Seating capacity"
          type="number"
          min={1}
          max={100}
          error={errors.capacity?.message}
          {...register("capacity", { valueAsNumber: true })}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting || !branchId}
            className="bg-[#FF6B35] hover:bg-[#F05520]"
          >
            {isSubmitting ? "Saving…" : "Add table"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
