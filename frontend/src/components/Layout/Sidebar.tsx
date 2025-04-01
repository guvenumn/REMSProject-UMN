// Path: /frontend/src/components/Layout/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, getThemeClasses } from "@/contexts/ThemeContext";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, isMobile, sidebarOpen, closeSidebar } = useTheme();

  const themeClasses = getThemeClasses(theme);

  // Define navigation items with role-based access
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      roles: ["ADMIN", "AGENT", "USER"],
    },
    {
      name: "Properties",
      href: "/dashboard/properties",
      icon: (
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      roles: ["ADMIN", "AGENT"],
    },
    {
      name: "Add Property",
      href: "/dashboard/properties?action=add",
      icon: (
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      roles: ["ADMIN", "AGENT"],
    },
    {
      name: "User Management",
      href: "/dashboard/users",
      icon: (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      roles: ["ADMIN"], // Admin only
    },
    {
      name: "Admin Dashboard",
      href: "/dashboard/admin",
      icon: (
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
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      roles: ["ADMIN"], // Admin only
    },
    {
      name: "Messages",
      href: "/messages",
      icon: (
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      roles: ["ADMIN", "AGENT", "USER"],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      roles: ["ADMIN", "AGENT", "USER"],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // For mobile, if the sidebar is not open, don't render it
  if (isMobile && !sidebarOpen) {
    return null;
  }

  // Mobile overlay if sidebar is open
  const mobileOverlay = isMobile && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={closeSidebar}
    ></div>
  );

  return (
    <>
      {mobileOverlay}
      <div
        className={`${
          isMobile ? "fixed inset-y-0 left-0 z-50" : "h-full"
        } w-64 flex flex-col transition-all duration-300 ${
          themeClasses.sidebar
        }`}
      >
        <div
          className={`p-4 border-b ${
            theme !== "white" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <Link
            href="/dashboard"
            className="flex items-center"
            onClick={isMobile ? closeSidebar : undefined}
          >
            {user?.avatarUrl ? (
              <div className="mr-2 h-8 w-8 rounded-full overflow-hidden">
                <img
                  src={user.avatarUrl}
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="mr-2 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span
                className={`text-base font-semibold ${
                  theme !== "white" ? "text-white" : "text-gray-800"
                }`}
              >
                {user?.name || "User"}
              </span>
              <span
                className={`text-xs ${
                  theme !== "white" ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {user?.role || ""}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? themeClasses.sidebarLinkActive
                    : themeClasses.sidebarLink
                }`}
                onClick={isMobile ? closeSidebar : undefined}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Selection */}
        <div
          className={`p-4 border-t ${
            theme !== "white" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div
            className={`text-xs font-medium mb-2 ${
              theme !== "white" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Theme
          </div>
          <div className="flex space-x-2">
            <ThemeButton themeColor="white" label="Light" />
            <ThemeButton themeColor="blue" label="Blue" />
            <ThemeButton themeColor="gray" label="Gray" />
            <ThemeButton themeColor="dark" label="Dark" />
          </div>
        </div>

        {/* Mobile only: Close button */}
        {isMobile && (
          <div className="p-4">
            <button
              onClick={closeSidebar}
              className={`w-full py-2 px-4 rounded text-center ${
                theme !== "white"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Close Menu
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Theme button component
type ThemeButtonProps = {
  themeColor: "white" | "blue" | "gray" | "dark";
  label: string;
};

const ThemeButton: React.FC<ThemeButtonProps> = ({ themeColor, label }) => {
  const { theme, setTheme } = useTheme();
  const isActive = theme === themeColor;

  // Theme button styles
  const getButtonStyles = () => {
    const baseStyles = "w-8 h-8 rounded-full border-2";

    if (isActive) {
      return `${baseStyles} border-primary`;
    }
    return `${baseStyles} border-transparent hover:border-gray-400`;
  };

  // Theme color styles
  const getColorStyles = () => {
    switch (themeColor) {
      case "blue":
        return "bg-blue-600";
      case "gray":
        return "bg-gray-800";
      case "dark":
        return "bg-gray-900";
      default:
        return "bg-white border border-gray-200";
    }
  };

  return (
    <button
      type="button"
      className={`flex flex-col items-center`}
      onClick={() => setTheme(themeColor)}
      title={`${label} theme`}
    >
      <div className={`${getButtonStyles()} ${getColorStyles()}`}></div>
      <span
        className={`text-xs mt-1 ${
          theme !== "white" ? "text-gray-300" : "text-gray-600"
        } ${isActive ? "font-medium" : ""}`}
      >
        {label}
      </span>
    </button>
  );
};

export default Sidebar;
