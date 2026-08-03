"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function FeedbackThanksPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="animate-fade-up rounded-3xl border border-white/80 bg-white/95 px-8 py-10 shadow-panel">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EE] text-[#FF6B35]">
          <Heart className="h-7 w-7 fill-[#FF6B35]" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-[#2F3E46]">
          Thank you!
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          We appreciate your feedback. Enjoy the rest of your day.
        </p>
        <Link
          href="/order"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#2F3E46] px-6 text-sm font-bold text-white"
        >
          Done
        </Link>
      </div>
    </main>
  );
}
