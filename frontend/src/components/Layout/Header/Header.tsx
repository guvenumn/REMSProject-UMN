// src/components/Layout/Header/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/Common/Button";
import { useAuth } from "@/contexts/AuthContext";

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get auth context data - handle both naming conventions
  const auth = useAuth();

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

  // Handle hydration mismatch by only rendering user-dependent content client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-primary">
            REMS
          </Link>

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
              <UserMenu user={user} />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
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
                      <div className="h-10 w-10 rounded-full bg-gray-200">
                        {user.avatar && (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user.name}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 w-full">
                    <Link
                      href="/login"
                      className="block"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="w-full">Log In</Button>
                    </Link>
                    <Link
                      href="/register"
                      className="block"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
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
