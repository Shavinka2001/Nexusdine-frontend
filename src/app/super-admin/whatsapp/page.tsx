"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import {
  fetchGlobalWhatsAppSettings,
  fetchSuperAdminTenants,
  patchTenantWhatsAppConfig,
  saveGlobalWhatsAppSettings,
  type SuperAdminTenant,
  type WhatsAppMode,
} from "@/lib/super-admin-api";
import { toast } from "@/store/useToastStore";

export default function SuperAdminWhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [tokenSet, setTokenSet] = useState(false);
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [topUps, setTopUps] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [global, list] = await Promise.all([
        fetchGlobalWhatsAppSettings(),
        fetchSuperAdminTenants(),
      ]);
      setSid(global.globalWhatsappSid ?? "");
      setPhone(global.globalWhatsappPhone ?? "");
      setTokenSet(global.globalWhatsappTokenSet);
      setToken("");
      setTenants(list);
    } catch (err) {
      toast(getApiErrorMessage(err, "Failed to load WhatsApp settings"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveGlobal(e: FormEvent) {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const payload: {
        globalWhatsappSid: string;
        globalWhatsappPhone: string;
        globalWhatsappToken?: string;
      } = {
        globalWhatsappSid: sid.trim(),
        globalWhatsappPhone: phone.trim(),
      };
      if (token.trim()) payload.globalWhatsappToken = token.trim();
      const saved = await saveGlobalWhatsAppSettings(payload);
      setTokenSet(saved.globalWhatsappTokenSet);
      setToken("");
      toast("Global WhatsApp settings saved", "success");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not save global settings"), "error");
    } finally {
      setSavingGlobal(false);
    }
  }

  async function setMode(tenant: SuperAdminTenant, mode: WhatsAppMode) {
    setBusyId(tenant.id);
    try {
      const updated = await patchTenantWhatsAppConfig(tenant.id, {
        whatsappMode: mode,
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? {
                ...t,
                whatsappMode: updated.whatsappMode,
                whatsappCredits: updated.whatsappCredits,
              }
            : t,
        ),
      );
      toast(`${tenant.name} → ${mode}`, "success");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not update mode"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function applyTopUp(tenant: SuperAdminTenant) {
    const amount = Number(topUps[tenant.id] ?? "");
    if (!Number.isInteger(amount) || amount < 1) {
      toast("Enter a positive credit amount", "error");
      return;
    }
    setBusyId(tenant.id);
    try {
      const updated = await patchTenantWhatsAppConfig(tenant.id, {
        creditsTopUp: amount,
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? { ...t, whatsappCredits: updated.whatsappCredits }
            : t,
        ),
      );
      setTopUps((prev) => ({ ...prev, [tenant.id]: "" }));
      toast(`Added ${amount} credits to ${tenant.name}`, "success");
    } catch (err) {
      toast(getApiErrorMessage(err, "Top-up failed"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF6B35]">
          Messaging
        </p>
        <h1 className="mt-1 font-display text-3xl text-[#2F3E46]">WhatsApp</h1>
        <p className="mt-1 text-sm text-slate-500">
          Shared gateway keys and per-tenant SHARED / CUSTOM (BYOK) controls.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <form
            onSubmit={onSaveGlobal}
            className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF6B35]" />
              <h2 className="font-display text-lg text-slate-900">
                Global WhatsApp settings
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Used for SHARED mode. Leave token blank to keep the existing
              secret.
              {tokenSet ? " (token on file)" : " (no token yet)"}
            </p>
            <Input
              label="Account SID"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              placeholder="ACxxxxxxxx"
              autoComplete="off"
            />
            <Input
              label="Auth token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={tokenSet ? "•••••••• (unchanged)" : "Auth token"}
              autoComplete="new-password"
            />
            <Input
              label="WhatsApp sender phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="whatsapp:+14155238886"
            />
            <Button type="submit" disabled={savingGlobal} fullWidth>
              {savingGlobal ? "Saving…" : "Save global keys"}
            </Button>
          </form>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-[#FF6B35]" />
              <h2 className="font-display text-lg text-slate-900">
                Tenant gateway mode
              </h2>
            </div>

            {tenants.length === 0 ? (
              <p className="text-sm text-slate-500">No restaurant tenants yet.</p>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => {
                  const busy = busyId === tenant.id;
                  return (
                    <div
                      key={tenant.id}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {tenant.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tenant.slug} · {tenant.branchCount} branches
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#FF6B35]">
                          {tenant.whatsappCredits} credits
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(["SHARED", "CUSTOM"] as WhatsAppMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            disabled={busy}
                            onClick={() => void setMode(tenant, mode)}
                            className={cn(
                              "rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition",
                              tenant.whatsappMode === mode
                                ? "bg-[#FF6B35] text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                            )}
                          >
                            {mode === "SHARED"
                              ? "Shared gateway"
                              : "Custom BYOK"}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div className="min-w-[8rem] flex-1">
                          <Input
                            label="Top-up credits"
                            type="number"
                            min={1}
                            value={topUps[tenant.id] ?? ""}
                            onChange={(e) =>
                              setTopUps((prev) => ({
                                ...prev,
                                [tenant.id]: e.target.value,
                              }))
                            }
                            placeholder="e.g. 500"
                          />
                        </div>
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void applyTopUp(tenant)}
                        >
                          Apply top-up
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
