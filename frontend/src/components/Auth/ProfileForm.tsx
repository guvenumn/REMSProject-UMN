// Path: /frontend/src/components/Auth/ProfileForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

// Define form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileForm = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      avatarUrl: "",
    },
  });

  // Load user data when available
  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("phone", user.phone || "");
      setValue("avatarUrl", user.avatarUrl || "");
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user, setValue]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const fileUrl = URL.createObjectURL(file);
      setAvatarPreview(fileUrl);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // If there's a new avatar file, upload it first
      let avatarUrl = data.avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);

        // Get token from localStorage
        const token = localStorage.getItem("token");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            // Include the authorization header
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload avatar");
        }

        const result = await response.json();
        avatarUrl = result.file.path;
      }

      // Update profile with the avatar URL
      await updateProfile({
        ...data,
        avatarUrl,
      });

      toast.success("Profile updated successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar upload section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-3xl">
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>

          <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
            Change profile picture
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            disabled // Email cannot be changed
          />
          <p className="text-xs text-gray-500">
            Email cannot be changed. Contact support if you need to update your
            email.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number (optional)
          </label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
