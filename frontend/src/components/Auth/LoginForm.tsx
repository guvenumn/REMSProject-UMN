// Path: src/components/Auth/LoginForm.tsx||
"use client";
import { withSuspense } from "@/utils/withSuspense";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

// Define form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Debug flag
const ENABLE_DEBUG = true;
const debug = (...args: unknown[]) => {
  if (ENABLE_DEBUG) {
    console.log("[LoginForm]", ...args);
  }
};

type LoginFormProps = {
  redirectTo?: string;
  message?: string;
};

const LoginForm = ({ redirectTo = "/dashboard", message }: LoginFormProps) => {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Set client-side rendering flag
  useEffect(() => {
    debug("Component mounted, setting isClient");
    setIsClient(true);
  }, []);

  // Log auth state changes
  useEffect(() => {
    debug(
      `Auth state changed - isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, user: ${
        user ? user.email : "null"
      }`
    );
  }, [isAuthenticated, isLoading, user]);

  // Check if already authenticated, redirect if needed
  useEffect(() => {
    if (isClient && isAuthenticated && user) {
      debug(
        `User already authenticated (${user.email}), redirecting to ${redirectTo}`
      );
      router.push(redirectTo);
    }
  }, [isAuthenticated, user, router, redirectTo, isClient]);

  // Effect to redirect after successful login
  useEffect(() => {
    if (loginAttempted && isAuthenticated && user) {
      debug(
        `Login attempt successful (${user.email}), redirecting to ${redirectTo}`
      );
      router.push(redirectTo);
    }
  }, [loginAttempted, isAuthenticated, user, router, redirectTo]);

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    debug(`Submitting login form with email: ${data.email}`);
    setGeneralError(null);
    setLoginAttempted(false);

    try {
      const success = await login(data.email, data.password);

      if (success) {
        debug("Login returned success");
        toast.success("Logged in successfully");

        // Mark login as attempted so we can redirect in the effect
        setLoginAttempted(true);
      } else {
        debug("Login returned failure");
        setGeneralError("Login failed. Please check your credentials.");
        toast.error("Login failed");
      }
    } catch (error) {
      debug("Login threw an error:", error);

      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An error occurred during login. Please try again.");
      }

      toast.error("Login failed");
    }
  };

  // If already authenticated and we're on the client, show loading while redirect happens
  if (isClient && isAuthenticated && user) {
    debug("Rendering redirect message");
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Redirecting...</span>
      </div>
    );
  }

  debug("Rendering login form");
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        {message ? (
          <p className="text-gray-600 mt-2">{message}</p>
        ) : (
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {generalError}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
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

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
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
          loading={isLoading}
          className="mt-6"
        >
          Sign In
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Create one now
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default withSuspense(LoginForm);
