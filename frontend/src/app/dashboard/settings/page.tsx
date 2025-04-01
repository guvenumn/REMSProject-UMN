// Path: /frontend/src/app/dashboard/settings/page.tsx

"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Common/Card";
import { Input } from "@/components/Common/Input";
import { Button } from "@/components/Common/Button";
import { Select } from "@/components/Common/Select";

export default function SettingsPage() {
  // System Settings
  const [siteName, setSiteName] = useState("REMS - Real Estate Management System");
  const [siteDescription, setSiteDescription] = useState(
    "Find your dream property with our comprehensive real estate management platform."
  );
  const [contactEmail, setContactEmail] = useState("info@remsiq.com");
  const [featuredPropertiesCount, setFeaturedPropertiesCount] = useState("6");
  
  // Email Settings
  const [smtpHost, setSmtpHost] = useState("smtp.example.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("notifications@remsiq.com");
  const [smtpPassword, setSmtpPassword] = useState("••••••••••••");
  
  // Notification Settings
  const [enableUserRegistrationNotifications, setEnableUserRegistrationNotifications] = useState(true);
  const [enableNewInquiryNotifications, setEnableNewInquiryNotifications] = useState(true);
  const [enablePropertyStatusChangeNotifications, setEnablePropertyStatusChangeNotifications] = useState(true);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save settings to the backend
    console.log("Saving general settings:", {
      siteName,
      siteDescription,
      contactEmail,
      featuredPropertiesCount,
    });
  };

  const handleSaveEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save email settings to the backend
    console.log("Saving email settings:", {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
    });
  };

  const handleSaveNotificationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save notification settings to the backend
    console.log("Saving notification settings:", {
      enableUserRegistrationNotifications,
      enableNewInquiryNotifications,
      enablePropertyStatusChangeNotifications,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
              <Input
                label="Site Name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-foreground-light mb-1">
                  Site Description
                </label>
                <textarea
                  className="w-full p-2 border border-border rounded-md bg-accent"
                  rows={3}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                />
              </div>
              
              <Input
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              
              <Input
                label="Featured Properties Count"
                type="number"
                value={featuredPropertiesCount}
                onChange={(e) => setFeaturedPropertiesCount(e.target.value)}
              />
              
              <div>
                <Button type="submit">Save General Settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEmailSettings} className="space-y-4">
              <Input
                label="SMTP Host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
              
              <Input
                label="SMTP Port"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
              
              <Input
                label="SMTP Username"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
              
              <Input
                label="SMTP Password"
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
              />
              
              <div>
                <Button type="submit">Save Email Settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNotificationSettings} className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="userRegistration"
                  className="mr-2 h-4 w-4"
                  checked={enableUserRegistrationNotifications}
                  onChange={(e) => setEnableUserRegistrationNotifications(e.target.checked)}
                />
                <label htmlFor="userRegistration">
                  Email notification on new user registration
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newInquiry"
                  className="mr-2 h-4 w-4"
                  checked={enableNewInquiryNotifications}
                  onChange={(e) => setEnableNewInquiryNotifications(e.target.checked)}
                />
                <label htmlFor="newInquiry">
                  Email notification on new property inquiry
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="statusChange"
                  className="mr-2 h-4 w-4"
                  checked={enablePropertyStatusChangeNotifications}
                  onChange={(e) => setEnablePropertyStatusChangeNotifications(e.target.checked)}
                />
                <label htmlFor="statusChange">
                  Email notification on property status change
                </label>
              </div>
              
              <div>
                <Button type="submit">Save Notification Settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}