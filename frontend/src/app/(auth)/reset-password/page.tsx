// file: /frontend/src/app/(auth)/reset-password/page.tsx
import { Metadata } from "next";
import ResetPassword from "@/components/Auth/ResetPassword";

export const metadata: Metadata = {
  title: "Reset Password | Real Estate Management System",
  description:
    "Set a new password for your Real Estate Management System account.",
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
