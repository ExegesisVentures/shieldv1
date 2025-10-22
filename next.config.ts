import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment (disable for Vercel)
  // output: 'standalone',
  
  // Build ID for tracking deployments (updated: 2025-10-22)
  generateBuildId: async () => {
    return '04e921d-governance-restored'
  },
  
  eslint: {
    // Allow builds to proceed with ESLint warnings - fix them iteratively
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Fail builds if there are TypeScript errors for type safety
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
