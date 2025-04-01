// src/app/api-test/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { Button } from "@/components/Common/Button";
import { getAccessToken } from "@/utils/authClient";

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Get auth token
      const authToken = getAccessToken();
      addResult(
        "Auth token check",
        !!authToken ? "Token found" : "No token found"
      );

      if (!authToken) {
        setError("No authentication token found. Please log in first.");
        setLoading(false);
        return;
      }

      // Test API endpoint with direct fetch
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "${config.api.url}/api";
      addResult("API URL", apiUrl);

      // Test 1: Authentication check
      const authResponse = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const authData = await authResponse.json();
      addResult("Auth check", {
        status: authResponse.status,
        success: authResponse.ok,
        data: authData,
      });

      // Test 2: Properties endpoint
      const propertiesResponse = await fetch(`${apiUrl}/properties?limit=2`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const propertiesData = await propertiesResponse.json();
      addResult("Properties API test", {
        status: propertiesResponse.status,
        success: propertiesResponse.ok,
        dataCount: propertiesData?.data?.length || 0,
        pagination: propertiesData?.pagination,
      });

      // Test 3: Dashboard endpoint
      const dashboardResponse = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const dashboardData = await dashboardResponse.json();
      addResult("Dashboard API test", {
        status: dashboardResponse.status,
        success: dashboardResponse.ok,
        data: dashboardData,
      });
    } catch (err: any) {
      setError(`API test failed: ${err.message}`);
      console.error("API test error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addResult = (label: string, data: any) => {
    setResults((prev) => [
      ...prev,
      { label, data, timestamp: new Date().toISOString() },
    ]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>

      <div className="mb-6">
        <Button onClick={runTest} disabled={loading}>
          {loading ? "Running Tests..." : "Run API Tests"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="font-medium text-lg">{result.label}</h3>
                  <div className="mt-2 text-sm">
                    <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60">
                      {typeof result.data === "object"
                        ? JSON.stringify(result.data, null, 2)
                        : result.data}
                    </pre>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
