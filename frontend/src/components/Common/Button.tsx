// Path: /frontend/src/components/Common/Button.tsx

"use client";

import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "accent"
    | "pill";
  size?: "default" | "sm" | "lg" | "icon" | "pill";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary text-white hover:bg-primary-hover",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
      outline: "border border-accent-dark bg-accent hover:bg-accent-dark",
      secondary: "bg-secondary text-white hover:bg-secondary/80",
      ghost: "hover:bg-accent text-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      accent: "bg-primary hover:bg-primary-hover text-white",
      pill: "bg-accent text-foreground hover:bg-accent-dark rounded-full",
    };

    const sizeClasses = {
      default: "h-10 py-2 px-4 rounded-md",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10 rounded-full",
      pill: "h-8 px-5 py-1",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
