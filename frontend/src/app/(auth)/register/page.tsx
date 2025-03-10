// file: /frontend/src/app/(auth)/register/page.tsx
import { Metadata } from "next";
import RegisterForm from "@/components/Auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | Real Estate Management System",
  description:
    "Create a new account to access the Real Estate Management System.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
