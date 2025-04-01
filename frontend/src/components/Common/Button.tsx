"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "light" | "secondary";
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
  loading?: boolean; // For QuickSearch compatibility
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  loading, // Accept the loading prop
  fullWidth = false,
  className = "",
  ...props
}) => {
  const { theme } = useTheme();

  // Combine isLoading and loading props
  const showLoading = isLoading || loading;

  // Base classes
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

  // Width class
  const widthClass = fullWidth ? "w-full" : "";

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }[size];

  // Variant classes based on theme
  let variantClasses;

  if (theme === "white") {
    // Light theme variants
    variantClasses = {
      default: "bg-primary text-white hover:bg-primary-dark",
      outline:
        "border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
      light: "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    }[variant];
  } else if (theme === "blue") {
    // Blue theme variants
    variantClasses = {
      default: "bg-white text-blue-600 hover:bg-blue-50",
      outline:
        "border border-white bg-transparent text-white hover:bg-blue-700",
      ghost: "bg-transparent text-white hover:bg-blue-700",
      light: "bg-blue-700 text-white hover:bg-blue-800",
      secondary: "bg-blue-800 text-white hover:bg-blue-900",
    }[variant];
  } else if (theme === "gray") {
    // Gray theme variants
    variantClasses = {
      default: "bg-white text-gray-800 hover:bg-gray-100",
      outline:
        "border border-gray-600 bg-transparent text-white hover:bg-gray-700",
      ghost: "bg-transparent text-white hover:bg-gray-700",
      light: "bg-gray-700 text-white hover:bg-gray-600",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
    }[variant];
  } else {
    // Dark theme variants
    variantClasses = {
      default: "bg-gray-700 text-white hover:bg-gray-600",
      outline:
        "border border-gray-600 bg-transparent text-white hover:bg-gray-800",
      ghost: "bg-transparent text-gray-300 hover:bg-gray-800",
      light: "bg-gray-600 text-white hover:bg-gray-700",
      secondary: "bg-gray-800 text-white hover:bg-gray-900",
    }[variant];
  }

  // Directly use the rest of the props without extra destructuring
  const buttonProps = props;

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={showLoading || props.disabled}
      {...buttonProps}
    >
      {showLoading && (
        <svg
          className="w-4 h-4 mr-2 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
