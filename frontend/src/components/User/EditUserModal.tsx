// Path: /frontend/src/components/User/EditUserModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/Common/Modal";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { Select } from "@/components/Common/Select";
import { uploadAvatar, User } from "@/utils/userClient";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  user: User;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
}) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: "",
    confirmPassword: "",
    role: user.role,
    phone: user.phone || "",
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changePassword, setChangePassword] = useState(false);
  const [removeAvatarFlag, setRemoveAvatarFlag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form when user changes
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      phone: user.phone || "",
    });
    setAvatarPreview(user.avatarUrl || null);
    setAvatar(null);
    setChangePassword(false);
    setErrors({});
    setRemoveAvatarFlag(false);
  }, [user]);

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
      if (name === "changePassword") {
        setChangePassword((e.target as HTMLInputElement).checked);

        // Clear password fields and errors when toggling
        if (!changePassword) {
          setFormData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }));

          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.password;
            delete newErrors.confirmPassword;
            return newErrors;
          });
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: (e.target as HTMLInputElement).checked,
        }));
      }
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

      // If there was a previous preview from a file upload (not the initial user avatar)
      if (avatarPreview && !user.avatarUrl) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatarFlag(false);

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

  const removeAvatar = () => {
    // If there's a preview URL from a file upload, revoke it
    if (avatarPreview && avatar) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatar(null);
    setAvatarPreview(null);
    setRemoveAvatarFlag(true);
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

    if (changePassword) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
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
      // Prepare user data
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null,
      };

      // Add password if changing it
      if (changePassword && formData.password) {
        userData.password = formData.password;
      }

      // Handle avatar changes
      if (avatar) {
        // Upload new avatar
        try {
          const avatarUrl = await uploadAvatar(avatar);
          userData.avatarUrl = avatarUrl;
        } catch (error) {
          console.error("Avatar upload failed:", error);
          setErrors((prev) => ({
            ...prev,
            avatar: "Failed to upload avatar",
          }));
          setIsLoading(false);
          return;
        }
      } else if (removeAvatarFlag) {
        // User removed their avatar
        userData.removeAvatar = true;
      }

      // Submit user data
      await onSubmit(userData);

      // Clean up avatar preview URL if it was created from a File object
      if (avatarPreview && avatar) {
        URL.revokeObjectURL(avatarPreview);
      }

      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to update user. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="md">
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
              <div className="w-full h-full flex items-center justify-center bg-primary text-white">
                {user.name.charAt(0).toUpperCase()}
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

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {avatarPreview ? "Change avatar" : "Upload avatar"}
            </button>

            {avatarPreview && (
              <button
                type="button"
                onClick={removeAvatar}
                className="text-sm text-destructive hover:underline"
                disabled={isLoading}
              >
                Remove
              </button>
            )}
          </div>

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

        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="changePassword"
            name="changePassword"
            checked={changePassword}
            onChange={handleChange}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <label htmlFor="changePassword" className="text-sm">
            Change Password
          </label>
        </div>

        {changePassword && (
          <>
            <Input
              label="New Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
              required={changePassword}
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isLoading}
              required={changePassword}
            />
          </>
        )}

        <Select
          label="Role"
          name="role"
          options={roleOptions}
          value={formData.role}
          onChange={handleChange}
          disabled={isLoading}
        />

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
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
