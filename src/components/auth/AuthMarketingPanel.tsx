import { Clock3, ShieldCheck, WifiOff } from "lucide-react";

const metrics = [
  { value: "2.4k+", label: "Orders / peak day" },
  { value: "99.2%", label: "Sync success" },
  { value: "<3s", label: "Avg. ticket time" },
];

export function AuthMarketingPanel() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden lg:flex lg:w-[48%] xl:w-1/2">
      {/* Full-bleed atmosphere — restaurant evening glow */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(28,37,42,0.82) 0%, rgba(47,62,70,0.55) 45%, rgba(255,107,53,0.45) 100%), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.35),transparent_45%)]" />

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <div>
          <p className="font-display text-4xl tracking-tight text-white xl:text-5xl">
            Nexus<span className="text-primary-300">Dine</span>
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            The offline-first restaurant POS built for Sri Lankan floors —
            waiters on mobile, cashiers on tablet, kitchen in sync.
          </p>
        </div>

        <div className="space-y-8">
          <ul className="grid grid-cols-3 gap-4">
            {metrics.map((m) => (
              <li key={m.label} className="text-white">
                <p className="font-display text-3xl tracking-tight">{m.value}</p>
                <p className="mt-1 text-xs text-white/65">{m.label}</p>
              </li>
            ))}
          </ul>

          <ul className="space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <WifiOff className="h-4 w-4 text-primary-200" />
              </span>
              Keep selling through spotty Wi‑Fi
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Clock3 className="h-4 w-4 text-primary-200" />
              </span>
              Thumb-speed ordering for waiters
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-4 w-4 text-primary-200" />
              </span>
              Multi-branch roles & tax-ready invoices
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
