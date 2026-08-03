import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · NexusDine",
  description: "Sign in to your NexusDine restaurant workspace",
};

export default function LoginPage() {
  return (
    <AuthSplitLayout
      footer={
        <>
          New to NexusDine?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary-600"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <p className="text-sm text-secondary-400">Loading sign-in…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
