// File: /frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000", // Important: This allows local Next.js server to serve images
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002", // Backend server
        pathname: "/uploads/**",
      },
    ],
  },
  // Keep the existing rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:3002/api/:path*",
      },
    ];
  },
  // This is optional, but can help with debugging
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
