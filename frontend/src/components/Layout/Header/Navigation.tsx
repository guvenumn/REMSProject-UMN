"use client";

// Path: /frontend/src/components/Layout/Header/Navigation.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

interface NavigationItem {
  label: string;
  href: string;
}

export interface NavigationProps {
  items?: NavigationItem[];
  className?: string;
  variant?: "default" | "admin";
}

const defaultItems: NavigationItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Rent", href: "/rent" },
  { label: "Sell", href: "/sell" },
];

const adminItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Properties", href: "/dashboard/properties" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Messages", href: "/dashboard/messages" },
];

const Navigation: React.FC<NavigationProps> = ({
  items,
  className,
  variant = "default",
}) => {
  const pathname = usePathname();

  // Select items based on variant if not explicitly provided
  const navigationItems =
    items || (variant === "admin" ? adminItems : defaultItems);

  return (
    <nav className={cn("flex items-center space-x-6", className)}>
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive ? "text-primary font-semibold" : "text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export { Navigation };
