import Link from "next/link";
import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account · NexusDine",
  description: "Onboard your restaurant on NexusDine in three steps",
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-600"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}
