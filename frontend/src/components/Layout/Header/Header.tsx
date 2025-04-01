// src/components/Layout/Header/Header.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/Common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { UnreadIndicator } from "@/components/Messages/UnreadIndicator";
import { useTheme, getThemeClasses } from "@/contexts/ThemeContext";

// Define User type based on Prisma schema
type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  active: boolean;
  role: "USER" | "AGENT" | "ADMIN";
};

// Define Auth context type to handle both naming conventions
type AuthContextType = {
  user: User | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  loading?: boolean; // Alternative naming
  logout?: () => Promise<void>;
};

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get auth context data - handle both naming conventions
  const auth = useAuth() as AuthContextType;

  // Get theme context data
  const { theme, isMobile, toggleSidebar } = useTheme();
  const themeClasses = getThemeClasses(theme);

  // Safely access properties regardless of which context implementation is used
  const user = auth.user;
  const isAuthenticated =
    "isAuthenticated" in auth ? auth.isAuthenticated : !!user;
  const isLoading =
    "isLoading" in auth
      ? auth.isLoading
      : "loading" in auth
      ? auth.loading
      : false;
  const logout = auth.logout || (() => Promise.resolve());

  // Handle hydration mismatch by only rendering user-dependent content client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to determine if we're on a dashboard page
  const isDashboardPage = () => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname.startsWith("/dashboard") ||
        window.location.pathname.startsWith("/messages")
      );
    }
    return false;
  };

  // Handle logout in mobile view
  const handleMobileLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${themeClasses.header}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            {/* Show sidebar toggle button on mobile dashboard pages */}
            {mounted && isMobile && isDashboardPage() && (
              <button
                type="button"
                className="mr-3 text-gray-500 hover:text-gray-600 focus:outline-none"
                onClick={toggleSidebar}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <Link href="/" className="flex flex-col">
              <span
                className={`font-extrabold text-3xl tracking-[0.30em] leading-tight ${
                  theme !== "white" ? "text-white" : "text-primary"
                }`}
              >
                REMS
              </span>
              <span
                className={`text-sm tracking-wide  ${
                  theme !== "white" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Find Your Dream
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!mounted ? (
              // Initial SSR placeholder - a fixed width element to prevent layout shift
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            ) : isLoading ? (
              // Show loading skeleton after mounted
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {/* Updated Message Icon with Blue Color */}
                <Link href="/messages" className="relative flex items-center">
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="#4682B4"
                    >
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                    <div className="absolute -top-1 -right-0 translate-x-1/2">
                      <UnreadIndicator currentUserId={user.id} />
                    </div>
                  </div>
                </Link>
                <UserMenu user={user} />
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant={theme !== "white" ? "light" : "ghost"}>
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant={theme !== "white" ? "secondary" : "default"}>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                theme !== "white"
                  ? "text-white hover:text-gray-200 hover:bg-black hover:bg-opacity-10"
                  : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden ${theme !== "white" ? "bg-opacity-95" : ""} ${
            themeClasses.header
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                theme !== "white"
                  ? "text-white hover:bg-black hover:bg-opacity-10"
                  : "text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/properties?listingType=SALE"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                theme !== "white"
                  ? "text-white hover:bg-black hover:bg-opacity-10"
                  : "text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Buy
            </Link>
            <Link
              href="/properties?listingType=RENT"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                theme !== "white"
                  ? "text-white hover:bg-black hover:bg-opacity-10"
                  : "text-gray-900 hover:bg-gray-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rent
            </Link>
            {mounted && isAuthenticated && user && (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    theme !== "white"
                      ? "text-white hover:bg-black hover:bg-opacity-10"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/messages"
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    theme !== "white"
                      ? "text-white hover:bg-black hover:bg-opacity-10"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex-grow">Messages</span>
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="#4682B4"
                    >
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                    <div className="absolute -top-1 -right-0 translate-x-1/2">
                      <UnreadIndicator currentUserId={user.id} />
                    </div>
                  </div>
                </Link>
                <Link
                  href="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    theme !== "white"
                      ? "text-white hover:bg-black hover:bg-opacity-10"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/favorites"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    theme !== "white"
                      ? "text-white hover:bg-black hover:bg-opacity-10"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Favorites
                </Link>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    theme !== "white"
                      ? "text-white hover:bg-black hover:bg-opacity-10"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={handleMobileLogout}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
          <div
            className={`pt-4 pb-3 border-t ${
              theme !== "white" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            {!mounted ? (
              // Initial SSR placeholder
              <div className="flex items-center px-5">
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="flex items-center px-5">
                {isLoading ? (
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                ) : isAuthenticated && user ? (
                  <>
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 relative">
                        {user.avatarUrl && (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name}
                            className="rounded-full"
                            fill
                            sizes="40px"
                          />
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div
                        className={`text-base font-medium ${
                          theme !== "white" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {user.name}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          theme !== "white" ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {user.email}
                      </div>
                    </div>
                    <button
                      className={`ml-auto p-2 rounded-full ${
                        theme !== "white"
                          ? "bg-black bg-opacity-20 text-white hover:bg-opacity-30"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (isDashboardPage()) {
                          toggleSidebar();
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 w-full">
                    <Link
                      href="/login"
                      className="block"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        className="w-full"
                        variant={theme !== "white" ? "light" : "default"}
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      className="block"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant={theme !== "white" ? "secondary" : "outline"}
                        className="w-full"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
