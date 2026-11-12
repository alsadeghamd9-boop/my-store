import type { NextConfig } from "next";

// TypeScript errors are intentionally NOT ignored during production builds.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Permit Arena preview hosts and local browser tests in development.
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.e2b.app"],
};

export default nextConfig;
