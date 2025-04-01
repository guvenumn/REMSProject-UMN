// Path: /frontend/src/app/profile/reset-password/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

export default withSuspense(function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { updatePassword } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [successMessage, setSuccessMessage] = useState(""); // We'll use query param instead
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Local state derived from query param
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  );

  // Check for success query parameter on mount/param change
  useEffect(() => {
    const successParam = searchParams?.get("success");
    if (successParam === "true") {
      setShowSuccessMessage(true);
      // Start countdown immediately if showing success message from query
      setRedirectCountdown(3);
      // Optional: Remove the query parameter from the URL without reloading
      // router.replace('/profile/reset-password', { scroll: false }); // Use replace to avoid history entry
    } else {
      setShowSuccessMessage(false); // Ensure it's false if param is not present
    }
  }, [searchParams, router]); // Depend on searchParams

  // Handle countdown and redirect after successful password change
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    // Only run countdown if the success message is showing
    if (
      showSuccessMessage &&
      redirectCountdown !== null &&
      redirectCountdown > 0
    ) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    if (showSuccessMessage && redirectCountdown === 0) {
      console.log("Redirecting to dashboard...");
      timer = setTimeout(() => {
        // Before redirecting, remove the success param if you haven't already
        router.replace("/profile/reset-password", { scroll: false });
        router.push("/dashboard");
      }, 100);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [redirectCountdown, router, showSuccessMessage]); // Add showSuccessMessage dependency

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword.trim())
      newErrors.currentPassword = "Current password is required";
    if (!formData.newPassword.trim())
      newErrors.newPassword = "New password is required";
    else if (formData.newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters";
    if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualRedirect = () => {
    console.log("Manual redirect to dashboard");
    setRedirectCountdown(null); // Cancel countdown
    // Before redirecting, remove the success param if you haven't already
    router.replace("/profile/reset-password", { scroll: false });
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear errors on new submit

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await updatePassword(formData.currentPassword, formData.newPassword);

      // --- SUCCESS ---
      // Don't set local success state. Instead, redirect with query parameter.
      toast.success("Password updated successfully!");
      // Redirect to the same page but add ?success=true
      // Using push will reload the component and the useEffect will catch the param
      router.push("/profile/reset-password?success=true");
      // State clearing (formData, isSubmitting) will happen naturally on redirect/remount
    } catch (error: unknown) {
      // (Error handling remains the same)
      if (error instanceof Error) {
        if (error.message === "incorrect_password") {
          setErrors({ currentPassword: "Current password is incorrect" });
          toast.error("Current password is incorrect");
        } else {
          setErrors({
            form: error.message || "Password update failed. Please try again.",
          });
          toast.error(error.message || "Password update failed");
        }
      } else {
        setErrors({
          form: "An unexpected error occurred. Please try again later.",
        });
        toast.error("An unexpected error occurred.");
      }
      console.error("Password update error:", error);
      setIsSubmitting(false); // Make sure to stop submitting state on error
    }
    // No finally block needed here as redirect handles the state reset on success
  };

  // ----- Conditional Rendering Logic based on showSuccessMessage -----
  if (showSuccessMessage) {
    return (
      // (Success message JSX - kept the same as the previous good version)
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border p-8 text-center">
          <div className="mb-5 flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Password Changed!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Your password has been successfully updated.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-gray-500 text-sm">
              {redirectCountdown !== null && redirectCountdown > 0 ? (
                <>
                  Redirecting in {redirectCountdown} second
                  {redirectCountdown !== 1 ? "s" : ""}...
                </>
              ) : redirectCountdown === 0 ? (
                "Redirecting now..."
              ) : (
                ""
              )}
            </span>
            <button
              onClick={handleManualRedirect}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-150"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- Render the Form -----
  return (
    // (Form JSX - kept the same as the previous good version)
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h1 className="text-2xl font-semibold mb-6">Change Password</h1>

      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.currentPassword ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.currentPassword}
              aria-describedby={
                errors.currentPassword ? "currentPassword-error" : undefined
              }
            />
            {errors.currentPassword && (
              <p
                id="currentPassword-error"
                className="mt-1 text-sm text-red-600"
              >
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.newPassword ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.newPassword}
              aria-describedby={
                errors.newPassword ? "newPassword-error" : "newPassword-hint"
              }
            />
            {errors.newPassword ? (
              <p id="newPassword-error" className="mt-1 text-sm text-red-600">
                {errors.newPassword}
              </p>
            ) : (
              <p id="newPassword-hint" className="mt-1 text-sm text-gray-500">
                Must be at least 8 characters.
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
            />
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="mt-1 text-sm text-red-600"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
});
