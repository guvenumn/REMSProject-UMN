// Path: frontend/src/components/Layout/Header/Header.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";
import { cn } from "@/utils/cn";

interface HeaderProps {
  className?: string;
  transparent?: boolean;
  variant?: "default" | "admin" | "user";
}

const Header: React.FC<HeaderProps> = ({
  className,
  transparent = false,
  variant = "default",
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Example user (replace with data from my auth hook)
  const user =
    variant === "user" || variant === "admin"
      ? { name: "User", email: "user@example.com" }
      : null;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border",
        isScrolled || !transparent
          ? "bg-white shadow-sm py-3"
          : transparent
          ? "bg-transparent py-5"
          : "bg-white py-3",
        className
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-[70px]">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="bg-primary rounded-md h-10 w-[140px] flex items-center justify-center">
              <span className="text-sm font-bold text-white">REMSProject</span>
            </div>
          </Link>

          <div className="hidden md:block ml-10">
            <Navigation />
          </div>
        </div>

        <div className="flex items-center">
          {variant === "admin" && (
            <Link href="/properties/add">
              <button className="ml-5 h-10 px-4 bg-primary text-white rounded-md text-sm font-medium">
                Add Property
              </button>
            </Link>
          )}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
};

export { Header };
