// src/components/Layout/Header/Navigation.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, getThemeClasses } from "@/contexts/ThemeContext";

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  const links = [
    { href: "/", label: "Home" },
    { href: "/properties?listingType=SALE", label: "Buy" },
    { href: "/properties?listingType=RENT", label: "Rent" },
  ];

  return (
    <nav className="flex space-x-6">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href.includes("?") && pathname === link.href.split("?")[0]);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium hover:${
              themeClasses.headerLink.split(" ")[1]
            } ${
              isActive ? themeClasses.headerLinkActive : themeClasses.headerLink
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
