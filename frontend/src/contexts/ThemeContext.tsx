"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeColor = "white" | "blue" | "gray" | "dark";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  isMobile: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize theme from localStorage if available
  const [theme, setThemeState] = useState<ThemeColor>("white");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set theme and save to localStorage
  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("rems-theme", newTheme);
    }
  };

  // Toggle sidebar state
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    // Load theme from localStorage
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(
        "rems-theme"
      ) as ThemeColor | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isMobile,
        sidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper function to get theme-based classes
export const getThemeClasses = (theme: ThemeColor) => {
  switch (theme) {
    case "blue":
      return {
        header: "bg-blue-600 text-white",
        headerLink: "text-white hover:text-blue-100",
        headerLinkActive: "text-white font-bold",
        sidebar: "bg-blue-700 text-white",
        sidebarLink: "text-white hover:bg-blue-800",
        sidebarLinkActive: "bg-blue-900 text-white",
        button: "bg-white text-blue-600 hover:bg-blue-50",
        buttonSecondary: "bg-blue-700 text-white hover:bg-blue-800",
      };
    case "gray":
      return {
        header: "bg-gray-800 text-white",
        headerLink: "text-white hover:text-gray-300",
        headerLinkActive: "text-white font-bold",
        sidebar: "bg-gray-900 text-white",
        sidebarLink: "text-white hover:bg-gray-800",
        sidebarLinkActive: "bg-gray-700 text-white",
        button: "bg-white text-gray-800 hover:bg-gray-100",
        buttonSecondary: "bg-gray-700 text-white hover:bg-gray-600",
      };
    case "dark":
      return {
        header: "bg-gray-900 text-white",
        headerLink: "text-gray-300 hover:text-white",
        headerLinkActive: "text-white font-bold",
        sidebar: "bg-gray-800 text-white",
        sidebarLink: "text-gray-300 hover:bg-gray-700",
        sidebarLinkActive: "bg-gray-700 text-white",
        button: "bg-gray-700 text-white hover:bg-gray-600",
        buttonSecondary: "bg-gray-600 text-white hover:bg-gray-500",
      };
    default: // white
      return {
        header: "bg-white text-gray-800 shadow-sm",
        headerLink: "text-gray-700 hover:text-primary",
        headerLinkActive: "text-primary font-medium",
        sidebar: "bg-white text-gray-800 border-r border-gray-200",
        sidebarLink: "text-gray-700 hover:bg-gray-100",
        sidebarLinkActive: "bg-primary text-white",
        button: "bg-primary text-white hover:bg-primary-dark",
        buttonSecondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      };
  }
};
