// Path: /frontend/src/components/Common/Select.tsx

"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  label?: string;
  error?: string;
  children?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options = [], label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-xs font-medium text-foreground-light mb-1"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <select
          className={cn(
            "h-10 w-full rounded-md border border-accent-dark bg-accent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        >
          {children
            ? children
            : options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
