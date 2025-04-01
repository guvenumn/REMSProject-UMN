// file: /frontend/src/app/(auth)/layout.tsx
"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between">
        {/* <div className="p-12">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-white.svg"
              alt="REMS Logo"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div> */}

        <div className="relative flex-1 flex items-center justify-center">
          <div className="p-12 max-w-lg">
            <h1 className="text-4xl font-bold text-white mb-6">
              Find Your Perfect Property
            </h1>
            <p className="text-xl text-blue-100">
              Join our platform to discover exclusive properties and connect
              with trusted agents across the globe.
            </p>
          </div>
          {/* <Image
            src="/auth-bg.jpg"
            alt="Real Estate"
            fill
            className="absolute inset-0 object-cover mix-blend-overlay opacity-20"
          /> */}
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex justify-center items-center">
        <div className="w-full max-w-md p-8">
          {/* <div className="mb-6 flex justify-center lg:hidden">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="REMS Logo"
                width={140}
                height={35}
                className="h-8 w-auto"
              />
            </Link>
          </div> */}

          {/* Auth form content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
