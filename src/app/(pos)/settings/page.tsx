"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchMyWhatsAppStatus,
  saveMyWhatsAppCredentials,
  type TenantWhatsAppStatus,
} from "@/lib/super-admin-api";
import { toast } from "@/store/useToastStore";

export default function SettingsPage() {
  const [status, setStatus] = useState<TenantWhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyWhatsAppStatus();
      setStatus(data);
      setAccountSid(data.custom.accountSid);
      setFromNumber(data.custom.fromNumber);
      setAuthToken("");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not load WhatsApp settings"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveByok(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: {
        accountSid: string;
        fromNumber: string;
        authToken?: string;
      } = {
        accountSid: accountSid.trim(),
        fromNumber: fromNumber.trim(),
      };
      if (authToken.trim()) payload.authToken = authToken.trim();
      const updated = await saveMyWhatsAppCredentials(payload);
      setStatus(updated);
      setAuthToken("");
      toast("WhatsApp credentials saved", "success");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not save credentials"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="flex w-full min-h-0 flex-col">
        <div>
          <h1 className="font-display text-2xl text-[#2F3E46] md:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Station preferences and WhatsApp receipt delivery for your
            restaurant.
          </p>
        </div>

        <div className="mx-0 mt-6 grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Station */}
          <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div>
              <h2 className="font-display text-xl text-slate-900">Station</h2>
              <p className="mt-1 text-sm text-slate-500">
                Local device preferences for offline POS use.
              </p>
            </div>
            <div className="mt-5 flex flex-1 flex-col gap-4">
              <Input label="Display name" defaultValue="Waiter tablet 1" />
              <Input
                label="API base URL"
                defaultValue={
                  process.env.NEXT_PUBLIC_API_URL ||
                  "http://localhost:3001/api"
                }
              />
              <Button
                fullWidth
                type="button"
                className="mt-auto bg-[#FF6B35] font-bold text-white hover:bg-[#FF6B35]/90"
              >
                Save
              </Button>
            </div>
          </section>

          {/* WhatsApp */}
          <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B35]" />
              <div>
                <h2 className="font-display text-xl text-slate-900">
                  WhatsApp receipts
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Digital receipts sent after checkout.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-1 flex-col">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : status?.whatsappMode === "SHARED" ? (
                <div className="flex flex-1 flex-col gap-4">
                  <div className="rounded-xl bg-[#FFF3EE] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#FF6B35]">
                      Shared gateway
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#2F3E46]">
                      Remaining Messages: {status.whatsappCredits}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Each digital receipt uses 1 credit from your trial /
                      top-up balance.
                    </p>
                  </div>
                  <Button
                    fullWidth
                    type="button"
                    className="mt-auto bg-[#FF6B35] font-bold text-white hover:bg-[#FF6B35]/90"
                    onClick={() =>
                      toast(
                        "Contact NexusDine support or your account manager to purchase a top-up package.",
                        "info",
                      )
                    }
                  >
                    Purchase Top-up
                  </Button>
                </div>
              ) : status?.whatsappMode === "CUSTOM" ? (
                <form
                  onSubmit={onSaveByok}
                  className="flex flex-1 flex-col gap-3"
                >
                  <p className="text-sm text-slate-500">
                    Custom (BYOK) mode — receipts use your own Twilio / Meta
                    WhatsApp Business credentials. Leave token blank to keep
                    the existing secret.
                    {status.custom.authTokenSet ? " (token on file)" : ""}
                  </p>
                  <Input
                    label="Twilio Account SID"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    placeholder="ACxxxxxxxx"
                    required
                    autoComplete="off"
                  />
                  <Input
                    label="Auth token"
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder={
                      status.custom.authTokenSet
                        ? "•••••••• (unchanged)"
                        : "Auth token"
                    }
                    autoComplete="new-password"
                  />
                  <Input
                    label="WhatsApp sender phone"
                    value={fromNumber}
                    onChange={(e) => setFromNumber(e.target.value)}
                    placeholder="whatsapp:+94xxxxxxxxx"
                    required
                  />
                  <Button
                    type="submit"
                    fullWidth
                    disabled={saving}
                    className="mt-auto bg-[#FF6B35] font-bold text-white hover:bg-[#FF6B35]/90"
                  >
                    {saving ? "Saving…" : "Save credentials"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  WhatsApp status unavailable.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
