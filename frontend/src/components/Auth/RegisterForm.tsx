// Path: /frontend/src/components/Auth/RegisterForm.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Common/Button";
import { Input } from "@/components/Common/Input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

// Define form validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .email("Please enter a valid email")
      .min(1, "Email is required"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["USER", "AGENT"]).default("USER"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userName, setUserName] = useState("");

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      agreeToTerms: false,
    },
  });

  // Watch the role field
  const role = watch("role");

  // Handle form submission
  const onSubmit = async (data: RegisterFormValues) => {
    setGeneralError(null);
    setLoading(true);

    try {
      // Remove confirmPassword and agreeToTerms fields before sending to API
      const { confirmPassword, agreeToTerms, ...registrationData } = data;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const unusedVars = { confirmPassword, agreeToTerms }; // Suppress unused vars warning

      await registerUser(registrationData);
      setRegistrationSuccess(true);
      setUserName(data.name);
      toast.success("Registration successful!");
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError(
          "An error occurred during registration. Please try again."
        );
      }

      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {registrationSuccess ? (
        <div className="p-6 bg-green-50 border border-green-100 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Welcome aboard!
          </h2>
          <p className="text-green-700 mb-4">
            Dear {userName}, your account has been successfully created and you
            are now logged in. Welcome to your journey to find your dream home!
          </p>
          <Link
            href="/properties"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Exploring Properties
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Create an account
            </h1>
            <p className="text-gray-600 mt-2">Join our platform today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {generalError}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                {...register("name")}
                error={errors.name?.message}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
              />
            </div>

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
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number (optional)
              </label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register("phone")}
                error={errors.phone?.message}
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                }
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Account Type
              </label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="USER"
                    className="h-4 w-4 text-blue-600"
                    {...register("role")}
                  />
                  <span className="ml-2 text-gray-700">Regular User</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="AGENT"
                    className="h-4 w-4 text-blue-600"
                    {...register("role")}
                  />
                  <span className="ml-2 text-gray-700">Real Estate Agent</span>
                </label>
              </div>

              {role === "AGENT" && (
                <p className="text-xs text-amber-600 mt-1">
                  Note: Agent accounts require approval from our team before
                  listing properties.
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-blue-600"
                  {...register("agreeToTerms")}
                />
                <span className="ml-2 text-gray-700 text-sm">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth={true}
              loading={loading}
              className="mt-6"
            >
              Create Account
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default RegisterForm;
