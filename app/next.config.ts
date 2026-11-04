import type { NextConfig } from "next";

const onVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  output: "export",
  // Served at /dashboard by the root vercel.json rewrites.
  basePath: onVercel ? "/dashboard" : undefined,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? (onVercel ? "/api" : ""),
  },
};

export default nextConfig;
