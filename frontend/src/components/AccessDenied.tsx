"use client";
import { withSuspense } from "@/utils/withSuspense";
// src/components/AccessDenied.tsx
import { Button } from "@/components/Common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  redirectPath?: string;
  redirectLabel?: string;
}

function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this section. This area is restricted to administrators and agents.",
  redirectPath = "/dashboard",
  redirectLabel = "Return to Dashboard",
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2">Permission Required</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <Button onClick={() => router.push(redirectPath)}>
              {redirectLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withSuspense(AccessDenied);
