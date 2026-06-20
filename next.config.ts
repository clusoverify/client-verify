import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel automatically sets NODE_ENV=production on deploy
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Security headers (also defined in vercel.json for edge)
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

export default nextConfig;
