// file: /frontend/src/app/(auth)/login/page.tsx
"use client";

import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8">
        <LoginForm />
      </div>
    </div>
  );
}
