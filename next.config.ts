import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // تجاهل أخطاء TypeScript أثناء عملية البناء
    ignoreBuildErrors: true,
  },
  eslint: {
    // تجاهل أخطاء ESLint أثناء عملية البناء
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;