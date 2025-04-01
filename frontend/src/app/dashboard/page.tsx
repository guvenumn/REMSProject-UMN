// src/app/dashboard/page.tsx
"use client";

import { withSuspense } from "@/utils/withSuspense";
import { useEffect, useState } from "react";
import { Card } from "@/components/Common/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getDashboardStats, getRecentActivity } from "@/utils/dashboardClient";
import type { DashboardStats, ActivityItem } from "@/utils/dashboardClient";
import Image from "next/image";

export default withSuspense(function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication status and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log("User not authenticated, redirecting to login page");
      router.push("/login?redirect=/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching dashboard data...");

        // Fetch data in parallel with better error handling
        try {
          const statsData = await getDashboardStats();
          setStats(statsData);
        } catch (statsError) {
          console.error("Error fetching dashboard stats:", statsError);
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            totalProperties: 0,
            totalInquiries: 0,
            unreadMessages: 0,
            recentListings: 0,
            monthlyViews: 0,
          });
        }

        try {
          const activityData = await getRecentActivity(5);
          setRecentActivity(activityData);
        } catch (activityError) {
          console.error("Error fetching recent activity:", activityError);
          setRecentActivity([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching dashboard data:", error);
        setError(
          "Failed to load dashboard data. Please refresh the page or try again later."
        );

        // Use type checking instead of direct property access
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 401
        ) {
          setError("Your session has expired. Please log in again.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, isAuthenticated]);

  if (!isAuthenticated && !isLoading) {
    return null; // Don't render anything if not authenticated (redirect happens in useEffect)
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-3 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-6 rounded-lg">
          {error}
        </div>
      )}

      {user && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">
            Welcome back, {user.name || user.email}
          </h2>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your properties and
            inquiries.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-4">
            <h3 className="text-gray-500 text-sm font-medium">
              Total Properties
            </h3>
            <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-gray-500 text-sm font-medium">
              Active Inquiries
            </h3>
            <p className="text-2xl font-bold">{stats?.totalInquiries || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-gray-500 text-sm font-medium">
              Unread Messages
            </h3>
            <p className="text-2xl font-bold">{stats?.unreadMessages || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-gray-500 text-sm font-medium">Monthly Views</h3>
            <p className="text-2xl font-bold">{stats?.monthlyViews || 0}</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mb-8">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>

          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity to display.</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100"
                >
                  {activity.user.avatarUrl ? (
                    <div className="relative w-8 h-8">
                      <Image
                        src={activity.user.avatarUrl}
                        alt={activity.user.name}
                        className="rounded-full"
                        sizes="32px"
                        fill
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {activity.user.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {activity.type === "property_created" &&
                        "created a new property"}
                      {activity.type === "property_updated" &&
                        "updated a property"}
                      {activity.type === "message_received" && "sent a message"}
                      {activity.type === "inquiry_received" &&
                        "made an inquiry"}
                      {activity.type === "user_registered" &&
                        "joined the platform"}{" "}
                      {activity.target && (
                        <span>
                          on{" "}
                          <span className="font-medium">
                            {activity.target.title}
                          </span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onClick={() => router.push("/dashboard/properties?action=add")}
            >
              Add New Property
            </button>
            <button
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              onClick={() => router.push("/dashboard/inquiries")}
            >
              View Inquiries
            </button>
            <button
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              onClick={() => router.push("/messages")}
            >
              Check Messages
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
});
