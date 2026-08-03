"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <AuthSplitLayout
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-600"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="animate-fade-up space-y-4">
          <h1 className="font-display text-3xl tracking-tight text-secondary">
            Check your inbox
          </h1>
          <p className="text-sm text-secondary-400">
            If an account exists for{" "}
            <span className="font-medium text-secondary">{email}</span>, we sent
            reset instructions.
          </p>
          <Link href="/login">
            <Button fullWidth size="lg">
              Return to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="animate-fade-up space-y-5"
          noValidate
        >
          <div>
            <h1 className="font-display text-3xl tracking-tight text-secondary">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-secondary-400">
              Enter the email for your restaurant account.
            </p>
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="owner@restaurant.lk"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(undefined);
            }}
            error={error}
            leftIcon={<Mail className="h-5 w-5" />}
          />
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
