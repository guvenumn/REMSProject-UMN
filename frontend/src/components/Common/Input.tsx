// File: /frontend/src/components/Common/Input.tsx
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

// Extend HTML input props with our custom props
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Add label property
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, disabled, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative w-full">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              {icon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-500 focus-visible:ring-red-600",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
        </div>

        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input as default };
