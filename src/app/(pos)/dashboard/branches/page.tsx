"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Store } from "lucide-react";
import { BranchCard } from "@/components/features/branches/BranchCard";
import { CreateBranchModal } from "@/components/features/branches/CreateBranchModal";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { fetchBranches } from "@/lib/catalog-api";
import { toast } from "@/store/useToastStore";
import type { Branch } from "@/types/catalog";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch (error) {
      toast(getApiErrorMessage(error, "Failed to load branches"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell title="Branches">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Branch management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage outlets, contact details, and tax settings.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#F05520]"
        >
          <Plus className="h-4 w-4" />
          Create New Branch
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Store className="h-10 w-10 text-[#FF6B35]" />
          <p className="mt-3 font-display text-xl text-[#2F3E46]">
            No branches yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Create your first outlet to configure tax and staffing.
          </p>
          <Button
            className="mt-5 bg-[#FF6B35] hover:bg-[#F05520]"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create New Branch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}

      <CreateBranchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void load()}
      />
    </AppShell>
  );
}
