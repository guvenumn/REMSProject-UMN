// file: /frontend/src/app/(auth)/forgot-password/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import ResetPassword from "@/components/Auth/ResetPassword";

export const metadata: Metadata = {
  title: "Forgot Password | Real Estate Management System",
  description: "Reset your password for the Real Estate Management System.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
