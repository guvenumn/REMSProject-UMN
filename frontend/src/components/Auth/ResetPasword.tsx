// file: /frontend/src/components/Auth/ResetPassword.tsx
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

// Password reset form schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Forgot password form schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword, forgotPassword, loading } = useAuth();

  const [showResetForm, setShowResetForm] = useState(!!token);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset Password Form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Forgot Password Form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle reset password form submission
  const handleResetSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setGeneralError("No reset token provided");
      return;
    }

    setGeneralError(null);
    setSuccess(null);

    try {
      await resetPassword(token, data.password);
      setSuccess("Your password has been reset successfully.");
      toast.success("Password reset successful!");

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);

      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError(
          "An error occurred during password reset. Please try again."
        );
      }

      toast.error("Password reset failed");
    }
  };

  // Handle forgot password form submission
  const handleForgotSubmit = async (data: ForgotPasswordFormValues) => {
    setGeneralError(null);
    setSuccess(null);

    try {
      await forgotPassword(data.email);
      setSuccess(
        "If an account exists with that email, we have sent password reset instructions."
      );
      toast.success("Password reset instructions sent");

      // Reset form
      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Forgot password error:", error);

      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An error occurred. Please try again.");
      }

      toast.error("Failed to send reset instructions");
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {showResetForm ? "Reset Your Password" : "Forgot Your Password?"}
        </h1>
        <p className="text-gray-600 mt-2">
          {showResetForm
            ? "Enter your new password below"
            : "Enter your email and we'll send you instructions to reset your password"}
        </p>
      </div>

      {generalError && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {generalError}
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
          {success}
        </div>
      )}

      {showResetForm ? (
        // Reset password form
        <form
          onSubmit={resetPasswordForm.handleSubmit(handleResetSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...resetPasswordForm.register("password")}
              error={resetPasswordForm.formState.errors.password?.message}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long and contain at least
              one uppercase letter, one lowercase letter, and one number.
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...resetPasswordForm.register("confirmPassword")}
              error={
                resetPasswordForm.formState.errors.confirmPassword?.message
              }
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />
          </div>

          <Button
            type="submit"
            fullWidth={true}
            loading={loading}
            className="mt-6"
          >
            Reset Password
          </Button>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </form>
      ) : (
        // Forgot password form
        <form
          onSubmit={forgotPasswordForm.handleSubmit(handleForgotSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...forgotPasswordForm.register("email")}
              error={forgotPasswordForm.formState.errors.email?.message}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />
          </div>

          <Button
            type="submit"
            fullWidth={true}
            loading={loading}
            className="mt-6"
          >
            Send Reset Instructions
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
