// Path: /frontend/src/components/User/AddUserModal.tsx
"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/Common/Modal";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { uploadAvatar } from "@/utils/userClient";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<any>;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
    phone: "",
    active: true,
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleOptions = [
    { label: "Administrator", value: "ADMIN" },
    { label: "Agent", value: "AGENT" },
    { label: "Regular User", value: "USER" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type and size
      if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
        setErrors((prev) => ({
          ...prev,
          avatar: "Only JPEG and PNG images are allowed",
        }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        setErrors((prev) => ({
          ...prev,
          avatar: "Image must be less than 2MB",
        }));
        return;
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));

      // Clear avatar error
      if (errors.avatar) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.avatar;
          return newErrors;
        });
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Upload avatar if present
      let avatarUrl = null;
      if (avatar) {
        try {
          avatarUrl = await uploadAvatar(avatar);
        } catch (error) {
          console.error("Avatar upload failed:", error);
          setErrors((prev) => ({
            ...prev,
            avatar: "Failed to upload avatar",
          }));
          setIsLoading(false);
          return;
        }
      }

      // Prepare user data (excluding confirmPassword)
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        active: formData.active,
        ...(avatarUrl && { avatarUrl }),
      };

      // Submit user data
      await onSubmit(userData);

      // Clean up avatar preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to create user. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="w-24 h-24 rounded-full bg-gray-200 mb-3 overflow-hidden cursor-pointer"
            onClick={triggerFileInput}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={triggerFileInput}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {avatarPreview ? "Change avatar" : "Upload avatar"}
          </button>

          {errors.avatar && (
            <p className="mt-1 text-sm text-destructive">{errors.avatar}</p>
          )}
        </div>

        <Input
          label="Full Name"
          name="name"
          placeholder="Guven Yildiz"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          disabled={isLoading}
          required
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="john.doe@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          disabled={isLoading}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isLoading}
          required
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={isLoading}
          required
        />

        <Select
          label="Role"
          name="role"
          options={roleOptions}
          value={formData.role}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <label htmlFor="active" className="text-sm">
            Active Account
          </label>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {errors.submit}
          </div>
        )}

        <div className="pt-4">
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating User..." : "Create User"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
