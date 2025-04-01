// file: /frontend/src/app/(auth)/reset-password/page.tsx

import { Metadata } from "next";
import { Suspense } from "react";
import ResetPassword from "@/components/Auth/ResetPassword";

export const metadata: Metadata = {
  title: "Reset Password | Real Estate Management System",
  description: "Reset your password for the Real Estate Management System.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
