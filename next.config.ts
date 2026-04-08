import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed "output: export" — required for API routes (affiliate program backend).
  // Deploy to Vercel/Node.js host with server-side support.
  // Static export was removed when adding /app/api/affiliate/* routes.
};

export default nextConfig;
