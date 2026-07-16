import type { NextConfig } from "next";

const clerkFrontendHost = process.env.NEXT_PUBLIC_CLERK_FRONTEND_HOST ?? "*.clerk.accounts.dev";
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${clerkFrontendHost} https://clerk.${clerkFrontendHost.replace(/^\*\./, "")}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://${clerkFrontendHost}",
  `font-src 'self' https://fonts.gstatic.com https://${clerkFrontendHost}`,
  `img-src 'self' data: blob: https://${clerkFrontendHost} https://res.cloudinary.com${cloudinaryCloudName ? `/${cloudinaryCloudName}` : ""} https://raw.githubusercontent.com`,
  `connect-src 'self' https://${clerkFrontendHost} https://api.clerk.com https://res.cloudinary.com`,
  `frame-src 'self' https://${clerkFrontendHost} https://clerk.${clerkFrontendHost.replace(/^\*\./, "")}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
];

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
