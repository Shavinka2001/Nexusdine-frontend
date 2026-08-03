"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  Globe2,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Store,
  User,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-error";
import { registerRequest } from "@/lib/auth-api";
import {
  FieldErrors,
  isValidEmail,
  isValidPassword,
  isValidSriLankanPhone,
} from "@/lib/validation";
import {
  CUISINE_OPTIONS,
  CURRENCY_OPTIONS,
  TAX_OPTIONS,
  useRegisterStore,
} from "@/store/register-store";
import { StepProgress } from "./StepProgress";

type Step1Fields = "ownerName" | "email" | "phone" | "password";
type Step2Fields = "restaurantName" | "branchLocation" | "cuisineType";
type Step3Fields = "tableCount" | "currency" | "taxSelection";

export function RegisterForm() {
  const router = useRouter();
  const { step, data, update, nextStep, prevStep, reset } = useRegisterStore();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<
    FieldErrors<Step1Fields | Step2Fields | Step3Fields>
  >({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateStep1 = () => {
    const next: FieldErrors<Step1Fields> = {};
    if (!data.ownerName.trim()) next.ownerName = "Owner name is required";
    if (!data.email.trim()) next.email = "Email is required";
    else if (!isValidEmail(data.email))
      next.email = "Enter a valid email address";
    if (!data.phone.trim()) next.phone = "Phone number is required";
    else if (!isValidSriLankanPhone(data.phone))
      next.phone = "Use a valid Sri Lankan mobile (+94 7X XXX XXXX)";
    if (!data.password) next.password = "Password is required";
    else if (!isValidPassword(data.password))
      next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: FieldErrors<Step2Fields> = {};
    if (!data.restaurantName.trim())
      next.restaurantName = "Restaurant name is required";
    if (!data.branchLocation.trim())
      next.branchLocation = "Branch location is required";
    if (!data.cuisineType) next.cuisineType = "Select a cuisine type";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep3 = () => {
    const next: FieldErrors<Step3Fields> = {};
    if (!data.tableCount || data.tableCount < 1)
      next.tableCount = "Enter at least 1 table";
    if (!data.currency) next.currency = "Select a currency";
    if (!data.taxSelection) next.taxSelection = "Select a tax option";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onContinue = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) nextStep();
    else if (step === 2 && validateStep2()) nextStep();
  };

  const onFinish = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setServerError(null);
    setSubmitting(true);
    try {
      await registerRequest(data);
      reset();
      router.replace("/login?registered=1");
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, "Could not create your restaurant account"),
      );
      setDone(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="animate-fade-up space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl tracking-tight text-secondary">
          You&apos;re all set
        </h1>
        <p className="text-sm text-secondary-400">
          <span className="font-medium text-secondary">{data.restaurantName}</span>{" "}
          is ready. Sign in to open your first service.
        </p>
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            reset();
            setDone(false);
            router.push("/login?registered=1");
          }}
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-2">
        <h1 className="font-display text-3xl tracking-tight text-secondary">
          Create your space
        </h1>
        <p className="mt-2 text-sm text-secondary-400">
          Three quick steps to launch your restaurant on NexusDine.
        </p>
      </div>

      <StepProgress current={step} />

      {serverError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      {step === 1 ? (
        <form
          key="step-1"
          onSubmit={onContinue}
          className="animate-fade-up space-y-4"
          noValidate
        >
          <Input
            label="Owner name"
            name="ownerName"
            autoComplete="name"
            placeholder="Nimal Perera"
            value={data.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            error={errors.ownerName}
            leftIcon={<User className="h-5 w-5" />}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="owner@restaurant.lk"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            error={errors.email}
            leftIcon={<Mail className="h-5 w-5" />}
          />
          <Input
            label="Phone number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            hint="Sri Lankan mobile numbers (+94)"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            error={errors.phone}
            leftIcon={<Phone className="h-5 w-5" />}
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            error={errors.password}
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
          />
          <Button type="submit" fullWidth size="lg" className="mt-2">
            Continue
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          key="step-2"
          onSubmit={onContinue}
          className="animate-fade-up space-y-4"
          noValidate
        >
          <Input
            label="Restaurant name"
            name="restaurantName"
            placeholder="Spice Harbour"
            value={data.restaurantName}
            onChange={(e) => update({ restaurantName: e.target.value })}
            error={errors.restaurantName}
            leftIcon={<Store className="h-5 w-5" />}
          />
          <Input
            label="Branch location"
            name="branchLocation"
            placeholder="Colombo 03 · Galle Road"
            value={data.branchLocation}
            onChange={(e) => update({ branchLocation: e.target.value })}
            error={errors.branchLocation}
            leftIcon={<MapPin className="h-5 w-5" />}
          />
          <Select
            label="Cuisine type"
            name="cuisineType"
            placeholder="Select cuisine"
            value={data.cuisineType}
            onChange={(e) =>
              update({
                cuisineType: e.target
                  .value as typeof data.cuisineType,
              })
            }
            options={[...CUISINE_OPTIONS]}
            error={errors.cuisineType}
            leftIcon={<Utensils className="h-5 w-5" />}
          />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button type="button" variant="ghost" fullWidth onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" fullWidth>
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          key="step-3"
          onSubmit={onFinish}
          className="animate-fade-up space-y-4"
          noValidate
        >
          <Input
            label="Table count"
            name="tableCount"
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={data.tableCount}
            onChange={(e) =>
              update({ tableCount: Number(e.target.value) || 0 })
            }
            error={errors.tableCount}
            leftIcon={<Hash className="h-5 w-5" />}
          />
          <Select
            label="Currency"
            name="currency"
            value={data.currency}
            onChange={(e) =>
              update({ currency: e.target.value as typeof data.currency })
            }
            options={[...CURRENCY_OPTIONS]}
            error={errors.currency}
            leftIcon={<Globe2 className="h-5 w-5" />}
          />
          <Select
            label="Default tax"
            name="taxSelection"
            value={data.taxSelection}
            onChange={(e) =>
              update({
                taxSelection: e.target.value as typeof data.taxSelection,
              })
            }
            options={[...TAX_OPTIONS]}
            error={errors.taxSelection}
            leftIcon={<Receipt className="h-5 w-5" />}
          />

          <div className="rounded-xl border border-secondary-100 bg-surface-muted/70 px-4 py-3 text-xs text-secondary-500">
            <p className="flex items-center gap-2 font-medium text-secondary">
              <Building2 className="h-4 w-4 text-primary" />
              Initial branch preview
            </p>
            <p className="mt-1.5">
              {data.restaurantName || "Your restaurant"} ·{" "}
              {data.tableCount || 0} tables · {data.currency} ·{" "}
              {data.taxSelection}
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button type="button" variant="ghost" fullWidth onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
