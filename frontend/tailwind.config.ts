// Path: /frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4a90e2",
        "primary-hover": "#3a80d2",
        secondary: "#2c3e50",
        "secondary-light": "#4a5568",
        accent: "#f5f5f5",
        "accent-dark": "#e0e0e0",
        foreground: "#333333",
        "foreground-light": "#666666",
        border: "#e0e0e0",
        background: "#f5f5f5",
        destructive: "#ef4444",
        success: "#10b981",
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
