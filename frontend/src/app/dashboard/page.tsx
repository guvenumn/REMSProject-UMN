// path: /frontend/src/app/dashboard/page.tsx

import React from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";

export default function Dashboard() {
  return (
    <Layout variant="dashboard">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-foreground-light">
                  Total Properties
                </p>
                <h3 className="text-2xl font-bold">104</h3>
                <p className="text-sm text-primary">↑ 12% this month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-foreground-light">Active Users</p>
                <h3 className="text-2xl font-bold">78</h3>
                <p className="text-sm text-primary">↑ 8% this month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-foreground-light">Revenue</p>
                <h3 className="text-2xl font-bold">$52.5k</h3>
                <p className="text-sm text-primary">↑ 15% this month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-accent rounded-md">
                    <th className="p-4 text-left text-sm font-medium text-foreground-light">
                      Property
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-foreground-light">
                      Price
                    </th>
                    {/* Add more table headers as needed */}
                  </tr>
                </thead>
                {/* Add table body here */}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
