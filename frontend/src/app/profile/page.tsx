// file: /frontend/src/app/profile/page.tsx
import { Metadata } from "next";
import ProfileForm from "@/components/Auth/ProfileForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Profile | Real Estate Management System",
  description:
    "Update your profile information on the Real Estate Management System.",
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>

        <Suspense
          fallback={<div className="text-center p-8">Loading profile...</div>}
        >
          <ProfileForm />
        </Suspense>
      </div>
    </div>
  );
}
