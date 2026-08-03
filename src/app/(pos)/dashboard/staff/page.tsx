"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { AddStaffModal } from "@/components/features/staff/AddStaffModal";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { normalizeRole, roleLabel } from "@/lib/roles";
import { deactivateStaff, fetchStaff } from "@/lib/staff-api";
import { toast } from "@/store/useToastStore";
import type { StaffMember } from "@/types/staff";

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStaff();
      setStaff(data);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load staff"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDeactivate = async (id: string) => {
    setRemovingId(id);
    try {
      await deactivateStaff(id);
      toast("Staff member deactivated", "success");
      await load();
    } catch (error) {
      toast(getApiErrorMessage(error, "Could not deactivate staff"), "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AppShell title="Staff">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Staff management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts for managers, cashiers, waiters, and kitchen staff.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Users className="h-10 w-10 text-[#FF6B35]" />
          <p className="mt-3 font-display text-xl text-[#2F3E46]">
            No staff yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add your first team member and assign them to a branch.
          </p>
          <Button
            className="mt-5 bg-[#FF6B35] hover:bg-[#F05520]"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((member) => {
                  const displayRole = roleLabel(normalizeRole(member.role));
                  const name = `${member.firstName} ${
                    member.lastName === "-" ? "" : member.lastName
                  }`.trim();
                  return (
                    <tr key={member.id} className="text-[#2F3E46]">
                      <td className="px-4 py-3.5 font-semibold">{name}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {member.email}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-[#FF6B35]/10 px-2.5 py-1 text-xs font-bold text-[#C94216]">
                          {displayRole}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {member.branch?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={removingId === member.id}
                          onClick={() => void onDeactivate(member.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          {removingId === member.id ? "…" : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void load()}
      />
    </AppShell>
  );
}
