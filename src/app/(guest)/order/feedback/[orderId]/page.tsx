"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { submitPublicFeedback } from "@/lib/public-api";
import { toast } from "@/store/useToastStore";

const RATING_EMOJI = ["😞", "😕", "😐", "🙂", "🤩"] as const;
const RATING_LABEL = [
  "Very poor",
  "Poor",
  "Okay",
  "Good",
  "Excellent",
] as const;

export default function OrderFeedbackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast("Please select a rating", "error");
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicFeedback({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      router.replace("/order/feedback/thanks");
    } catch (err) {
      toast(getApiErrorMessage(err, "Could not submit feedback"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const active = hover || rating;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <form
        onSubmit={onSubmit}
        className="animate-fade-up rounded-3xl border border-white/80 bg-white/95 p-6 shadow-panel"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B35]">
          How was your visit?
        </p>
        <h1 className="mt-1 font-display text-2xl text-[#2F3E46]">
          Rate your experience
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your feedback helps us serve you better.
        </p>

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const on = value <= active;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} star — ${RATING_LABEL[value - 1]}`}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(value)}
                className={cn(
                  "flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-transform active:scale-95",
                  on ? "bg-[#FFF3EE] text-[#FF6B35]" : "bg-slate-50 text-slate-300",
                )}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {on ? RATING_EMOJI[value - 1] : "☆"}
                </span>
                <Star
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5",
                    on ? "fill-[#FF6B35] text-[#FF6B35]" : "text-slate-300",
                  )}
                />
              </button>
            );
          })}
        </div>

        {active > 0 ? (
          <p className="mt-3 text-center text-sm font-semibold text-[#2F3E46]">
            {RATING_EMOJI[active - 1]} {RATING_LABEL[active - 1]}
          </p>
        ) : (
          <p className="mt-3 text-center text-sm text-slate-400">
            Tap a star to rate
          </p>
        )}

        <label className="mt-6 block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Comments (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Tell us more…"
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#F8F9FA] px-4 py-3 text-sm text-[#2F3E46] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] text-sm font-bold text-white shadow-md shadow-[#FF6B35]/25 transition enabled:active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Submit feedback"
          )}
        </button>
      </form>
    </main>
  );
}
