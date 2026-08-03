import { ReactNode, SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  leftIcon?: ReactNode;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      leftIcon,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-secondary">{label}</span>
        ) : null}
        <span className="relative block">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-center text-secondary-400">
              {leftIcon}
            </span>
          ) : null}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "min-h-12 w-full appearance-none rounded-xl border border-secondary-200 bg-surface-elevated",
              "text-base text-secondary",
              "transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              leftIcon ? "pl-12" : "pl-3.5",
              "pr-11",
              error && "border-red-500 focus:border-red-500 focus:ring-red-200",
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-secondary-400">
            <ChevronDown className="h-4 w-4" />
          </span>
        </span>
        {error ? (
          <span className="animate-fade-in text-xs text-red-600">{error}</span>
        ) : null}
      </label>
    );
  },
);

Select.displayName = "Select";
