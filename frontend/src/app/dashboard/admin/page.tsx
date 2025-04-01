// src/app/dashboard/admin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { withSuspense } from "@/utils/withSuspense";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Common/Card";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAdminDashboardStats,
  getSystemStatus,
  type AdminDashboardStats,
  type SystemStatus,
} from "@/utils/dashboardClient";

// Helper function to get status badge color class
function getStatusClass(status: string): string {
  switch (status) {
    case "operational":
      return "bg-green-100 text-green-800";
    case "degraded":
      return "bg-yellow-100 text-yellow-800";
    case "down":
      return "bg-red-100 text-red-800";
    case "loading":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper function to format status text
function formatStatus(status: string): string {
  if (status === "loading") return "Loading...";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function AdminDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    activeListings: 0,
    totalAgents: 0,
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: "loading",
    database: "loading",
    storage: "loading",
    auth: "loading",
  });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (isClient && !isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push("/login?redirect=/dashboard/admin");
        return;
      }

      if (user && user.role !== "ADMIN") {
        // Not an admin, redirect to properties dashboard
        console.log(
          "User is not an admin, redirecting to properties dashboard"
        );
        router.push("/dashboard/properties");
        return;
      }
    }
  }, [user, isLoading, router, isAuthenticated, isClient]);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (isAuthenticated && user?.role === "ADMIN") {
        try {
          setIsDataLoading(true);
          setError(null);

          // Get admin dashboard stats and system status in parallel
          const [statsData, statusData] = await Promise.all([
            getAdminDashboardStats(),
            getSystemStatus(),
          ]);

          setStats(statsData);
          setSystemStatus(statusData);
        } catch (err) {
          console.error("Error fetching admin dashboard data:", err);
          setError("Failed to load dashboard data. Please try again later.");
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    if (isClient && !isLoading && user?.role === "ADMIN") {
      fetchAdminData();
    }
  }, [user, isLoading, isAuthenticated, isClient]);

  // Display loading state while checking authentication
  if (!isClient || isLoading || !user) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If not admin but somehow on this page, show redirect message
  if (user.role !== "ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Redirecting...</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Admin dashboard stats display
  const adminStats = [
    {
      id: "total-users",
      label: "Total Users",
      value: isDataLoading ? "Loading..." : stats.totalUsers.toString(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: "total-properties",
      label: "Total Properties",
      value: isDataLoading ? "Loading..." : stats.totalProperties.toString(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: "active-listings",
      label: "Active Listings",
      value: isDataLoading ? "Loading..." : stats.activeListings.toString(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
    {
      id: "total-agents",
      label: "Total Agents",
      value: isDataLoading ? "Loading..." : stats.totalAgents.toString(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminStats.map((stat) => (
          <Card key={stat.id} className="p-6">
            <div className="flex items-center">
              <div className="mr-4">{stat.icon}</div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Admin Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex flex-col items-center justify-center text-center transition"
              onClick={() => router.push("/dashboard/users")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-indigo-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="font-medium">Manage Users</span>
            </button>

            <button
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center text-center transition"
              onClick={() => router.push("/dashboard/properties")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="font-medium">Properties</span>
            </button>

            <button
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center justify-center text-center transition"
              onClick={() => router.push("/dashboard/settings")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-medium">System Settings</span>
            </button>

            <button
              className="p-4 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col items-center justify-center text-center transition"
              onClick={() => window.open("/api-docs", "_blank")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span className="font-medium">API Docs</span>
            </button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          {isDataLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-medium">Backend API</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                    systemStatus.api
                  )}`}
                >
                  {formatStatus(systemStatus.api)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-medium">Database</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                    systemStatus.database
                  )}`}
                >
                  {formatStatus(systemStatus.database)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-medium">Storage Service</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                    systemStatus.storage
                  )}`}
                >
                  {formatStatus(systemStatus.storage)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Authentication Service</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                    systemStatus.auth
                  )}`}
                >
                  {formatStatus(systemStatus.auth)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default withSuspense(AdminDashboardPage);
