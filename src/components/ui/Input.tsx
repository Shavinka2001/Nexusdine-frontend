import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, id, leftIcon, rightSlot, ...props },
    ref,
  ) => {
    const inputId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-secondary">{label}</span>
        ) : null}
        <span className="relative block">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-secondary-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "min-h-12 w-full rounded-xl border border-secondary-200 bg-surface-elevated",
              "text-base text-secondary placeholder:text-secondary-400",
              "transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              leftIcon ? "pl-12" : "pl-3.5",
              rightSlot ? "pr-12" : "pr-3.5",
              error && "border-red-500 focus:border-red-500 focus:ring-red-200",
              className,
            )}
            {...props}
          />
          {rightSlot ? (
            <span className="absolute inset-y-0 right-0 flex items-center pr-1.5">
              {rightSlot}
            </span>
          ) : null}
        </span>
        {error ? (
          <span className="animate-fade-in text-xs text-red-600">{error}</span>
        ) : hint ? (
          <span className="text-xs text-secondary-400">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
