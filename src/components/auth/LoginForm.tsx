"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-error";
import { loginRequest, mapApiUserToAuthUser } from "@/lib/auth-api";
import { getHomeRouteForRole } from "@/lib/auth-redirect";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/auth";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const registered = searchParams.get("registered") === "1";
  const sessionExpired = searchParams.get("session") === "expired";
  const nextPath = searchParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const data = await loginRequest(values.email, values.password);
      const user = mapApiUserToAuthUser(data.user, {
        restaurantName: data.tenant?.name,
        logoUrl: data.tenant?.logoUrl,
      });
      login(data.accessToken, user);

      const destination =
        nextPath && nextPath.startsWith("/")
          ? nextPath
          : getHomeRouteForRole(user.role);

      router.replace(destination);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Invalid email or password"));
    }
  });

  return (
    <form onSubmit={onSubmit} className="animate-fade-up space-y-5" noValidate>
      <div>
        <h1 className="font-display text-3xl tracking-tight text-secondary">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-secondary-400">
          Sign in to your restaurant workspace.
        </p>
      </div>

      {registered ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          Account created successfully. Sign in to continue.
        </div>
      ) : null}

      {sessionExpired ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Your session expired. Please sign in again.
        </div>
      ) : null}

      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="owner@restaurant.lk"
        error={errors.email?.message}
        leftIcon={<Mail className="h-5 w-5" />}
        {...register("email")}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        leftIcon={<Lock className="h-5 w-5" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary-400 hover:bg-surface-muted hover:text-secondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        }
        {...register("password")}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:text-primary-600"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
